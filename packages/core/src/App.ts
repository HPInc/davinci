/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import pino, { Level, Logger } from 'pino';
import { ClassType, reflect } from '@davinci/reflector';
import deepmerge from 'deepmerge';
import { Module, ModuleStatus } from './Module';
import { mapSeries } from './lib/async-utils';
import { coerceArray } from './lib/array-utils';
import { di } from './di';
import { LocalVars, LocalVarsContainer, Signals } from './types';

export interface AppOptions {
	controllers?: ClassType[];
	shutdown?: {
		enabled?: boolean;
		signals?: Signals[];
	};
	logger?: {
		name?: string;
		level?: Level | 'silent';
	};
}

export class App extends Module implements LocalVarsContainer {
	logger: Logger;
	public locals: LocalVars = {};
	private options?: AppOptions = {};
	private modules: Module[] = [];
	private controllers: ClassType[];
	private modulesDic: Record<string, Module> = {};

	constructor(options?: AppOptions) {
		super();
		const defaultOptions: AppOptions = {
			shutdown: { enabled: true, signals: ['SIGTERM', 'SIGINT'] },
			logger: { name: 'app', level: 'info' }
		};
		this.options = deepmerge({ ...defaultOptions }, { ...options });
		this.controllers = options?.controllers ?? [];
		if (this.options.shutdown?.enabled) {
			this.enableShutdownSignals();
		}
		this.logger = pino({ name: this.options.logger?.name });
		if (this.options.logger?.level) {
			this.logger.level = this.options.logger?.level;
		}
	}

	public getModuleId(): string {
		return 'app';
	}

	public getOptions() {
		return this.options;
	}

	public async registerModule(module: Module): Promise<this>;
	public async registerModule(modules: Module[]): Promise<this>;
	public async registerModule(...modules: Module[]): Promise<this>;
	public async registerModule(...args: Array<unknown>) {
		const modules = coerceArray(args.length > 1 ? args : args[0]) as Module[];

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

		this.setStatus('registering');

		await mapSeries(modules, async mod => {
			mod.setStatus('registering');
			await mod.onRegister?.(this);
			mod.setStatus('registered');
		})
			.then(() => {
				const allModulesRegistered = Object.keys(this.modulesDic)
					.map(key => this.modulesDic[key].getStatus())
					.every(status => status === 'registered');

				if (allModulesRegistered) {
					this.setStatus('registered');
					this.eventBus.emit('registered');
				}
			})
			.catch(err => {
				this.logger.fatal({ error: err }, 'Fatal error during module registration');
				this.setStatus('error');
				throw err;
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
		const appStatus = this.getStatus();

		if (appStatus === 'registering') {
			await new Promise(resolve => {
				this.eventBus.once('registered', () => resolve(null));
			});
		}

		this.logger.debug('App initialization. Executing onInit hooks');
		this.setStatus('initializing');

		try {
			if (appStatus === 'error' || appStatus === 'destroyed') {
				this.logger.debug(`Automatically executing the onRegister hooks as the App status is: ${appStatus}`);
				const modulesCopy = [...this.modules];
				this.modules = [];
				this.modulesDic = {};
				await this.registerModule(modulesCopy);
			}

			await this.onInit?.(this);
			await mapSeries(this.modules, async module => {
				module.setStatus('initializing');
				await module.onInit?.(this);
				module.setStatus('initialized');
			});

			this.setStatus('initialized');
		} catch (err) {
			this.logger.fatal({ error: err }, 'Fatal error during module init');
			this.setStatus('error');
			throw err;
		}
	}

	public async shutdown() {
		this.logger.debug('App shutdown. Executing onDestroy hooks');
		this.setStatus('destroying');

		const wrapIntoPromise = async (fn: Function) => fn();

		try {
			await this.onDestroy?.(this);
			await mapSeries(this.modules, async module => {
				try {
					module.setStatus('destroying');
					await wrapIntoPromise(() => module.onDestroy?.(this));
					module.setStatus('destroyed');
				} catch (err) {
					this.logger.error({ moduleId: module.getModuleId(), error: err }, 'Error while destroying module');
				}
			});
			this.setStatus('destroyed');
		} catch (err) {
			this.logger.fatal({ error: err }, 'Fatal error');
			throw err;
		}
	}

	public getModules() {
		return this.modules;
	}

	public async getModuleById<M extends Module = Module>(moduleId: string, waitForStatus?: ModuleStatus): Promise<M> {
		const module = this.modulesDic[moduleId];
		if (waitForStatus) {
			return (await module.waitForStatus(waitForStatus)) as M;
		}

		return module as M;
	}

	public getControllers() {
		return this.controllers;
	}

	public getControllersWithReflection() {
		return (
			this.controllers?.map(Controller => {
				const controllerReflection = this.getControllerReflection(Controller);
				const controllerInstance = di.container.resolve(Controller);

				return { Controller, controllerInstance, reflection: controllerReflection };
			}) ?? []
		);
	}

	public getControllerReflection(controller: ClassType) {
		return reflect(controller);
	}

	public enableShutdownSignals() {
		const signals = this.options?.shutdown?.signals ?? [];
		const onSignal = async (signal: Signals) => {
			if (['destroying', 'destroyed'].includes(this.getStatus())) {
				this.logger.debug('App is already shutting down. Ignoring signal');
				return;
			}

			this.logger.info(`Received ${signal}, shutting down`);

			try {
				await this.shutdown();
				process.kill(process.pid, signal);
				process.exit(0);
			} catch (err) {
				process.exit(1);
			}
		};
		signals.forEach(signal => {
			process.on(signal, onSignal);
		});

		return this;
	}

	public addLocalVariable<T>(name: string, value: T) {
		Object.defineProperty(this.locals, name, {
			configurable: true,
			value
		});
	}
}

export const createApp = (options?: AppOptions) => new App(options);
