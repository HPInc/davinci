/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import pino, { Level } from 'pino';
import { ClassReflection, ClassType, reflect } from '@davinci/reflector';
import deepmerge from 'deepmerge';
import { EventEmitter } from 'events';
import { Module, ModuleStatus } from './Module';
import { mapSeries } from './lib/async-utils';
import { coerceArray } from './lib/array-utils';

type Signals =
	| 'SIGABRT'
	| 'SIGALRM'
	| 'SIGBUS'
	| 'SIGCHLD'
	| 'SIGCONT'
	| 'SIGFPE'
	| 'SIGHUP'
	| 'SIGILL'
	| 'SIGINT'
	| 'SIGIO'
	| 'SIGIOT'
	| 'SIGKILL'
	| 'SIGPIPE'
	| 'SIGPOLL'
	| 'SIGPROF'
	| 'SIGPWR'
	| 'SIGQUIT'
	| 'SIGSEGV'
	| 'SIGSTKFLT'
	| 'SIGSTOP'
	| 'SIGSYS'
	| 'SIGTERM'
	| 'SIGTRAP'
	| 'SIGTSTP'
	| 'SIGTTIN'
	| 'SIGTTOU'
	| 'SIGUNUSED'
	| 'SIGURG'
	| 'SIGUSR1'
	| 'SIGUSR2'
	| 'SIGVTALRM'
	| 'SIGWINCH'
	| 'SIGXCPU'
	| 'SIGXFSZ'
	| 'SIGBREAK'
	| 'SIGLOST'
	| 'SIGINFO';

export interface AppOptions {
	controllers?: ClassType[];
	shutdown?: {
		enabled?: boolean;
		signals?: Signals[];
	};
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
	private status: ModuleStatus = 'unloaded';
	private eventBus = new EventEmitter();

	constructor(options?: AppOptions) {
		super();
		const defaultOptions: AppOptions = {
			shutdown: { enabled: true, signals: ['SIGTERM', 'SIGINT'] },
			logger: { level: 'info' }
		};
		this.options = deepmerge({ ...defaultOptions }, { ...options });
		this.controllers = options?.controllers ?? [];
		if (this.options.shutdown?.enabled) {
			this.enableShutdownSignals();
		}
		this.logger.level = this.options.logger?.level;
	}

	public getModuleId(): string {
		return 'app';
	}

	public getOptions() {
		return this.options;
	}

	public async registerModule(modules: Module[]): Promise<this>;
	public async registerModule(module: Module): Promise<this>;
	public async registerModule(module: Module | Module[]) {
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

		this.status = 'registering';

		await new Promise((resolve, reject) => {
			process.nextTick(() => {
				mapSeries(modules, async mod => {
					const moduleId = coerceArray(mod.getModuleId())[0];
					const moduleState = this.modulesDic[moduleId];
					moduleState.status = 'registering';
					moduleState.initPromise = mod.onRegister?.(this);
					await moduleState.initPromise;
					moduleState.status = 'registered';
				})
					.then(() => {
						const allModulesRegistered = Object.keys(this.modulesDic)
							.map(key => this.modulesDic[key].status)
							.every(status => status === 'registered');

						if (allModulesRegistered) {
							this.status = 'registered';
							this.eventBus.emit('registered');
						}

						resolve(null);
					})
					.catch(err => {
						this.logger.fatal({ error: err }, 'Fatal error during module registration');
						this.status = 'error';
						reject(err);
					});
			});
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
		if (this.status === 'registering') {
			await new Promise(resolve => {
				this.eventBus.once('registered', () => resolve(null));
			});
		}
		this.logger.debug('App initialization. Executing onInit hooks');
		this.status = 'initializing';

		try {
			await this.onInit?.(this);
			await mapSeries(this.modules, async module => {
				const moduleId = coerceArray(module.getModuleId())[0];
				const moduleState = this.modulesDic[moduleId];
				moduleState.status = 'initializing';
				moduleState.initPromise = module.onInit?.(this);
				await moduleState.initPromise;
				moduleState.status = 'initialized';
			});

			this.status = 'initialized';
		} catch (err) {
			this.logger.fatal({ error: err }, 'Fatal error during module init');
			this.status = 'error';
			throw err;
		}
	}

	public async shutdown() {
		this.logger.debug('App shutdown. Executing onDestroy hooks');
		this.status = 'destroying';

		const wrapIntoPromise = async fn => fn();

		try {
			await this.onDestroy?.(this);
			await mapSeries(this.modules, module =>
				wrapIntoPromise(() => module.onDestroy?.(this)).catch(err =>
					this.logger.error({ moduleId: module.getModuleId(), error: err }, 'Error while destroying module')
				)
			);
			this.status = 'destroyed';
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

	public getStatus() {
		return this.status;
	}

	public enableShutdownSignals() {
		const signals = this.options.shutdown?.signals ?? [];
		const onSignal = async (signal: Signals) => {
			if (['destroying', 'destroyed'].includes(this.status)) {
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
}

export const createApp = (options?: AppOptions) => new App(options);
