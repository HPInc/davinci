/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { App, Module } from '@davinci/core';
import mongoose, { ConnectOptions } from 'mongoose';

export interface MongooseModuleOptions {
	connection: {
		uri: string;
		options?: ConnectOptions;
	};
}

export class MongooseModule extends Module {
	app: App;

	constructor(private options: MongooseModuleOptions) {
		super();
	}

	getModuleId() {
		return ['db', 'mongoose'];
	}

	async onInit(app: App) {
		this.app = app;
		const { uri, options } = this.options.connection;

		await mongoose.connect(uri, options);
	}

	getOptions() {
		return this.options;
	}
}
