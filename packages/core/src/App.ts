/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import pino from 'pino';
import { Module } from './Module';
import { mapSeries } from './lib/async';

const logger = pino({ name: 'app' });

export class App extends Module {
	private modules: Module[] = [];

	getModuleId(): string {
		return 'app';
	}

	async register(modules: Module[]): Promise<unknown>;
	async register(...modules: Module[]): Promise<unknown>;
	async register(module: Module): Promise<unknown>;
	async register(...args: any[]) {
		let modules: Module[] = [];

		if (args.length > 1) {
			modules = args;
		} else if (args) {
			modules = Array.isArray(args[0]) ? args[0] : [args[0]];
		}

		try {
			return await mapSeries(modules, mod => {
				this.modules.push(mod);
				return mod.onRegister?.(this);
			});
		} catch (err) {
			logger.error({ error: err }, 'Fatal error during module registration');
			throw err;
		}
	}

	async init() {
		logger.debug('App initialization. Executing onInit hooks');

		try {
			await this.onInit?.(this);
			return await mapSeries(this.modules, module => module.onInit?.(this));
		} catch (err) {
			logger.error({ error: err }, 'Fatal error during module init');
			throw err;
		}
	}

	async shutdown() {
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

	getModules() {
		return this.modules;
	}
}

export const createApp = () => new App();
