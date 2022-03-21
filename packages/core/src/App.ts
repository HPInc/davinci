/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import pino from 'pino';
import { Module } from './Module';
import { mapSeries } from './lib/async';

const logger = pino({ name: 'App' });

export class App {
	private modules: Module[] = [];

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
			// some logging
			logger.error({ error: err }, 'Fatal error');
			throw err;
		}
	}

	async init() {
		try {
			return await mapSeries(this.modules, module => module.onInit?.(this));
		} catch (err) {
			// some logging
			logger.error({ error: err }, 'Fatal error');
			throw err;
		}
	}

	async shutdown() {
		try {
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
