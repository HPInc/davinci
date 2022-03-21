/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { App } from '@davinci/core';
import axios from 'axios';
import { ExpressHttpModule } from '../../src/ExpressHttpModule';
import should from 'should';

describe('ExpressHttpModule', () => {
	let app: App;

	beforeEach(() => {
		app = new App();
	});

	afterEach(async () => {
		await app.shutdown().catch(() => {});
	});

	it('should initialize a listening server', async () => {
		const expressHttpModule = new ExpressHttpModule({ port: 3000 });
		app.register(expressHttpModule);

		await app.init();

		const { error } = await axios
			.get('http://localhost:3000')
			.then(response => ({ error: null, response }))
			.catch(error => ({ error }));

		should(error.response).have.property('status').equal(404);
	});

	it('should shutdown the listening server', async () => {
		const expressHttpModule = new ExpressHttpModule({ port: 3000 });
		app.register(expressHttpModule);

		await app.init();
		await app.shutdown().catch(err => err);

		const { error } = await axios
			.get('http://localhost:3000')
			.then(response => ({ error: null, response }))
			.catch(error => ({ error }));

		should(error.response).be.undefined();
		should(error.code).be.equal('ECONNREFUSED');
	});
});
