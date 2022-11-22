/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { App, mapParallel, Module } from '@davinci/core';
import type { HttpServerModule } from '@davinci/http-server';
import http, { Server } from 'http';
import { createTerminus, TerminusOptions } from '@godaddy/terminus';
import pino, { Level, Logger } from 'pino';
import { ClassReflection, ClassType, DecoratorId, MethodReflection, reflect } from '@davinci/reflector';
import { HealthCheckDecoratorData } from './decorators';

export interface HealthChecksModuleOptions {
	healthChecks?: { name: string; endpoint: string }[];
	terminusOptions?: Omit<TerminusOptions, 'healthChecks'>;
	logger?: {
		name?: string;
		level?: Level | 'silent';
	};
}

export class HealthChecksModule extends Module {
	app: App;
	logger: Logger;
	httpServer: Server;

	constructor(protected moduleOptions?: HealthChecksModuleOptions) {
		super();
		this.logger = pino({ name: this.moduleOptions.logger?.name ?? 'health-checks' });
	}

	getModuleId() {
		return 'health-checks';
	}

	onRegister(app: App) {
		const level = this.moduleOptions.logger?.level ?? app.getOptions().logger?.level;
		if (level) {
			this.logger.level = level;
		}
	}

	async onInit(app: App) {
		this.app = app;
		const httpServerModule = await app.getModuleById<HttpServerModule<{ Server: Server }>>('http', 'registered');
		this.httpServer = httpServerModule?.getHttpServer() ?? http.createServer();

		const findMatchingMethodAndDecoratorsReflections = (controllerReflection: ClassReflection) =>
			controllerReflection.methods.reduce<
				{ methodReflection: MethodReflection; decorators: Array<HealthCheckDecoratorData> }[]
			>((acc, method) => {
				const decorators = method.decorators.filter(d => d[DecoratorId] === 'health-check.method');
				acc.push({ methodReflection: method, decorators });

				return acc;
			}, []);

		const classesToInspect = [
			...this.app.getControllersWithReflection().map(({ Controller, controllerInstance, reflection }) => ({
				instance: controllerInstance,
				Class: Controller,
				reflection
			})),
			...this.app
				.getModules()
				.filter(m => m.getModuleId() !== this.getModuleId())
				.map(module => ({
					instance: module,
					Class: module.constructor as ClassType,
					reflection: reflect(module.constructor as ClassType)
				}))
		];

		const healthChecksFunctionsDict = classesToInspect.reduce<Record<string, Function[]>>(
			(acc, { instance, reflection }) => {
				const matchingMethodAndDecoratorReflections = findMatchingMethodAndDecoratorsReflections(reflection);
				matchingMethodAndDecoratorReflections.forEach(({ methodReflection, decorators }) => {
					decorators.forEach(decorator => {
						acc[decorator.healthCheckName] = acc[decorator.healthCheckName] ?? [];
						acc[decorator.healthCheckName].push(() => instance[methodReflection.name]());
					});
				});

				return acc;
			},
			{}
		);

		const healthCheckTerminusConfiguration = this.moduleOptions?.healthChecks?.reduce<
			TerminusOptions['healthChecks']
		>((acc, { name: healthCheckName, endpoint }) => {
			acc[endpoint] = () => mapParallel(healthChecksFunctionsDict[healthCheckName] ?? [], fn => fn());

			return acc;
		}, {});

		const foundHealthCheckNames = Object.keys(healthChecksFunctionsDict);
		const configuredHealthCheckNames = this.moduleOptions?.healthChecks?.map(({ name }) => name);
		foundHealthCheckNames.forEach(name => {
			if (!configuredHealthCheckNames.includes(name)) {
				throw new Error(`Health check "${name}" not listed in the configuration. Maybe a misspell?`);
			}
		});

		createTerminus(this.httpServer, {
			healthChecks: healthCheckTerminusConfiguration,
			useExit0: true,
			...this.moduleOptions?.terminusOptions
		});

		return healthCheckTerminusConfiguration;
	}
}
