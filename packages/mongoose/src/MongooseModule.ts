/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { App, Module } from '@davinci/core';
import mongoose, { ConnectOptions } from 'mongoose';
import { Level, Logger, pino } from 'pino';
import deepmerge from 'deepmerge';

export interface MongooseModuleOptions {
	connection: {
		uri: string;
		options?: ConnectOptions;
	};
	logger?: {
		name?: string;
		level?: Level | 'silent';
	};
}

export class MongooseModule extends Module {
	app: App;
	logger: Logger;
	options: MongooseModuleOptions;

	constructor(options: MongooseModuleOptions) {
		super();
		this.options = deepmerge({ logger: { name: 'MongooseModule' } }, options);
		this.logger = pino({ name: this.options.logger?.name });
		if (this.options.logger?.level) {
			this.logger.level = this.options.logger?.level;
		}
	}

	getModuleId() {
		return ['db', 'mongoose'];
	}

	onRegister(app: App) {
		const level = this.options.logger?.level ?? app.getOptions().logger?.level;
		if (level) {
			this.logger.level = level;
		}
	}

	async onInit(app: App) {
		this.app = app;
		const { uri, options } = this.options.connection;

		this.logger.debug('Initializing module');
		await mongoose.connect(uri, options);
		this.logger.info('Connection established');
	}

	async onDestroy() {
		await mongoose.disconnect();
		this.logger.info('Disconnected');
	}

	getOptions() {
		return this.options;
	}
}
