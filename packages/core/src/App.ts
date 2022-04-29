/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import pino from 'pino';
import { ClassReflection, ClassType, reflect } from '@davinci/reflector';
import { Module } from './Module';
import { mapSeries } from './lib/async-utils';
import { coerceArray } from './lib/array-utils';

const logger = pino({ name: 'app' });

export interface AppOptions {
	controllers?: ClassType[];
}

export class App extends Module {
	private modules: Module[] = [];
	private controllers: ClassType[];
	private controllersReflectionCache = new Map<ClassType, ClassReflection>();
	private modulesDic: Record<string, Module> = {};

	constructor(options?: AppOptions) {
		super();
		this.controllers = options?.controllers ?? [];
	}

	public getModuleId(): string {
		return 'app';
	}

	public registerModule(modules: Module[]): this;
	public registerModule(module: Module): this;
	public registerModule(module: Module | Module[]) {
		const modules: Module[] = coerceArray(module);

		modules.forEach(mod => {
			const moduleIds = coerceArray(mod.getModuleId());
			moduleIds.forEach(id => {
				if (this.modulesDic[id]) {
					throw new Error(`A module with the same identifier "${id}" has already been registered`);
				}

				this.modulesDic[id] = mod;
			});
			this.modules.push(mod);
		});

		return this;
	}

	public registerController(controllers: ClassType[]): this;
	public registerController(...controllers: ClassType[]): this;
	public registerController(controller: ClassType): this;
	public registerController(...args: any[]) {
		let controllers: ClassType[] = [];

		if (args.length > 1) {
			controllers = args;
		} else if (args) {
			controllers = coerceArray(args[0]);
		}

		this.controllers.push(...controllers);

		return this;
	}

	public async init() {
		logger.debug('App initialization. Executing onInit hooks');

		try {
			await this.onInit?.(this);
			return await mapSeries(this.modules, module => module.onInit?.(this));
		} catch (err) {
			logger.error({ error: err }, 'Fatal error during module init');
			throw err;
		}
	}

	public async shutdown() {
		logger.debug('App shutdown. Executing onDestroy hooks');

		try {
			await this.onDestroy?.(this);
			return await mapSeries(this.modules, module => module.onDestroy?.(this));
		} catch (err) {
			// some logging
			logger.error({ error: err }, 'Fatal error');
			throw err;
		}
	}

	public getModules() {
		return this.modules;
	}

	public getControllers() {
		return this.controllers;
	}

	public getControllersWithReflection() {
		return (
			this.controllers?.map(Controller => {
				const cached = this.controllersReflectionCache.get(Controller);
				if (cached) return { Controller, reflection: cached };

				const controllerReflection = this.getControllerReflection(Controller);
				this.controllersReflectionCache.set(Controller, controllerReflection);

				return { Controller, reflection: controllerReflection };
			}) ?? []
		);
	}

	public getControllerReflection(controller: ClassType) {
		return reflect(controller);
	}
}

export const createApp = (options?: AppOptions) => new App(options);
