/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { App } from '@davinci/core';
import { MongooseModule } from '../../src';
import mongoose from 'mongoose';
import { expect } from '../support/chai';

describe('MongooseModule', () => {
	it('should correctly initialize and connect', async () => {
		const module = new MongooseModule({ connection: { uri: 'mongodb://127.0.0.1/test' } });
		const app = new App({ logger: { level: 'silent' } });
		app.registerModule(module);

		await app.init();

		const readyState = mongoose.connection.readyState;
		expect(readyState).to.be.equal(1);
		expect(module.getStatus()).to.be.equal('initialized');
	});

	it('should correctly disconnect', async () => {
		const module = new MongooseModule({ connection: { uri: 'mongodb://127.0.0.1/test' } });
		const app = new App({ logger: { level: 'silent' } });
		app.registerModule(module);

		await app.init();
		await app.shutdown();

		const readyState = mongoose.connection.readyState;
		expect(readyState).to.be.equal(0);
		expect(module.getStatus()).to.be.equal('destroyed');
	});
});
