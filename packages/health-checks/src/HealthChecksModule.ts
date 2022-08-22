/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { App, mapParallel, Module } from '@davinci/core';
import type { HttpServerModule } from '@davinci/http-server';
import http, { Server } from 'http';
import { createTerminus, TerminusOptions } from '@godaddy/terminus';
import pino from 'pino';
import { ClassReflection, ClassType, DecoratorId, MethodReflection, reflect } from '@davinci/reflector';
import { HealthCheckDecoratorData } from './decorators';

// const isPrimitive = typeValue => [Object, Number, String, Date].includes(typeValue);

export interface HealthChecksModuleOptions {
	healthChecks?: { name: string; endpoint: string }[];
	terminusOptions?: Omit<TerminusOptions, 'healthChecks'>;
}

export class HealthChecksModule extends Module {
	app: App;
	logger = pino({ name: 'health-checks' });
	httpServer: Server;

	constructor(protected moduleOptions?: HealthChecksModuleOptions) {
		super();
	}

	getModuleId() {
		return 'health-checks';
	}

	async onInit(app: App) {
		this.app = app;
		const httpServerModule = await app.getModuleById<HttpServerModule<unknown, unknown, Server>>(
			'http',
			'registered'
		);
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
			...this.app
				.getControllersWithReflection()
				.map(({ Controller, reflection }) => ({ instance: null, Class: Controller, reflection })),
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
			(acc, { instance, Class, reflection }) => {
				const matchingMethodAndDecoratorReflections = findMatchingMethodAndDecoratorsReflections(reflection);
				const controllerInstance = instance ?? new Class();
				matchingMethodAndDecoratorReflections.forEach(({ methodReflection, decorators }) => {
					decorators.forEach(decorator => {
						acc[decorator.healthCheckName] = acc[decorator.healthCheckName] ?? [];
						acc[decorator.healthCheckName].push(() => controllerInstance[methodReflection.name]());
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
