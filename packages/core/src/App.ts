/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import pino, { Level } from 'pino';
import { ClassReflection, ClassType, reflect } from '@davinci/reflector';
import deepmerge from 'deepmerge';
import { Module, ModuleStatus } from './Module';
import { mapSeries } from './lib/async-utils';
import { coerceArray } from './lib/array-utils';

export interface AppOptions {
	controllers?: ClassType[];
	logger?: {
		level?: Level | 'silent';
	};
}

interface ModuleState {
	module: Module;
	status: ModuleStatus;
	initPromise?: ReturnType<Module['onInit']>;
}

export class App extends Module {
	logger = pino({ name: 'app' });
	private options?: AppOptions;
	private modules: Module[] = [];
	private controllers: ClassType[];
	private controllersReflectionCache = new Map<ClassType, ClassReflection>();
	private modulesDic: Record<string, ModuleState> = {};

	constructor(options?: AppOptions) {
		super();
		const defaultOptions: AppOptions = {
			logger: { level: 'info' }
		};
		this.options = deepmerge({ ...defaultOptions }, { ...options });
		this.controllers = options?.controllers ?? [];
		this.logger.level = this.options.logger?.level;
	}

	public getModuleId(): string {
		return 'app';
	}

	public getOptions() {
		return this.options;
	}

	public registerModule(modules: Module[]): this;
	public registerModule(module: Module): this;
	public registerModule(module: Module | Module[]) {
		const modules: Module[] = coerceArray(module);

		modules.forEach(mod => {
			const moduleIds = coerceArray(mod.getModuleId());
			const moduleStatus: ModuleState = { module: mod, status: 'unloaded' };
			moduleIds.forEach(id => {
				if (this.modulesDic[id]) {
					throw new Error(`A module with the same identifier "${id}" has already been registered`);
				}

				this.modulesDic[id] = moduleStatus;
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
		this.logger.debug('App initialization. Executing onInit hooks');

		try {
			await this.onInit?.(this);
			return await mapSeries(this.modules, async module => {
				const moduleId = coerceArray(module.getModuleId())[0];
				const moduleState = this.modulesDic[moduleId];
				moduleState.status = 'initializing';
				moduleState.initPromise = module.onInit?.(this);
				await moduleState.initPromise;
				moduleState.status = 'initialized';
			});
		} catch (err) {
			this.logger.fatal({ error: err }, 'Fatal error during module init');
			throw err;
		}
	}

	public async shutdown() {
		this.logger.debug('App shutdown. Executing onDestroy hooks');

		const wrapIntoPromise = async fn => fn();

		try {
			await this.onDestroy?.(this);
			await mapSeries(this.modules, module =>
				wrapIntoPromise(() => module.onDestroy?.(this)).catch(err =>
					this.logger.error({ moduleId: module.getModuleId(), error: err }, 'Error while destroying module')
				)
			);
		} catch (err) {
			this.logger.fatal({ error: err }, 'Fatal error');
			throw err;
		}
	}

	public getModules() {
		return this.modules;
	}

	public async getModuleById<M extends Module = Module>(moduleId: string, waitInitialization?: boolean): Promise<M> {
		const moduleState = this.modulesDic[moduleId];
		if (waitInitialization) {
			await moduleState.initPromise;
		}

		return moduleState.module as M;
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
