/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { expect } from 'chai';
import { App } from '@davinci/core';
import { route } from '@davinci/http-server';
import axios from 'axios';
import { createSandbox } from 'sinon';
import { reflect } from '@davinci/reflector';
import { ExpressHttpServer } from '../../src';

const sinon = createSandbox();

describe('ExpressHttpServer', () => {
	let app: App;

	beforeEach(() => {
		app = new App();
	});

	afterEach(async () => {
		await app.shutdown().catch(() => {});
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('lifecycle', () => {
		it('should initialize a listening server', async () => {
			const expressHttpServer = new ExpressHttpServer({ port: 3000 });
			app.registerModule(expressHttpServer);

			await app.init();

			const { error } = await axios
				.get('http://localhost:3000')
				.then(response => ({ error: null, response }))
				.catch(error => ({ error }));

			expect(error.response).to.have.property('status').equal(404);
		});

		it('should shutdown the listening server', async () => {
			const expressHttpServer = new ExpressHttpServer({ port: 3000 });
			app.registerModule(expressHttpServer);

			await app.init();
			await app.shutdown().catch(err => err);

			const { error } = await axios
				.get('http://localhost:3000')
				.then(response => ({ error: null, response }))
				.catch(error => ({ error }));

			expect(error.response).to.be.undefined;
			expect(error.code).be.equal('ECONNREFUSED');
		});
	});

	describe('#createRequestHandler', () => {
		it('should create a request handler for a controller method that succeed', async () => {
			const expressHttpServer = new ExpressHttpServer();
			class MyController {
				@route.get({ path: '/all' })
				getAll(
					@route.path() path: string,
					@route.query() filter: string,
					@route.body() body: object,
					@route.header({ name: 'x-accountid' }) accountId: string
				) {
					return { path, filter, body, accountId };
				}
			}
			const controller = new MyController();
			const replySpy = sinon.spy(expressHttpServer, 'reply');
			const controllerReflection = reflect(MyController);
			const methodReflection = controllerReflection.methods[0];
			const req = {
				params: { path: 'path' },
				query: { filter: 'myFilter' },
				header: () => 123,
				body: { isBody: true }
			};
			const res = { status: sinon.stub(), send: sinon.stub(), json: sinon.stub() };

			const handler = expressHttpServer.createRequestHandler(controller, 'getAll', {
				controllerReflection,
				methodReflection
			});
			// @ts-ignore
			await handler(req, res);

			expect(res.json.args[0][0]).to.be.deep.equal({
				path: 'path',
				accountId: 123,
				body: {
					isBody: true
				},
				filter: 'myFilter'
			});
			expect(replySpy.called).to.be.true;
		});

		it('should create a request handler for a controller method that fails', async () => {
			const expressHttpServer = new ExpressHttpServer();
			class MyController {
				@route.get({ path: '/all' })
				getAll(@route.query() filter: string) {
					throw new Error('Invalid');
					return { filter };
				}
			}
			const controller = new MyController();
			const replySpy = sinon.spy(expressHttpServer, 'reply');
			const controllerReflection = reflect(MyController);
			const methodReflection = controllerReflection.methods[0];
			const req = { query: { filter: 'myFilter' } };
			const res = { status: sinon.stub(), send: sinon.stub(), json: sinon.stub() };

			const handler = expressHttpServer.createRequestHandler(controller, 'getAll', {
				controllerReflection,
				methodReflection
			});
			// @ts-ignore
			await handler(req, res);

			expect(res.status.args[0][0]).to.be.equal(500);
			expect(res.json.args[0][0]).to.be.deep.equal({ error: true, message: 'Invalid' });
			expect(replySpy.called).to.be.true;
		});
	});

	describe('#createRoutes', () => {
		it('should walk the controller reflection and register routes in express', async () => {
			class MyController {
				@route.get({ path: '/' })
				getAll(@route.query() filter: string) {
					return { filter };
				}

				@route.patch({ path: '/:id' })
				update(@route.path() id: string, @route.body() data: object) {
					return { id, data };
				}

				@route.post({ path: '/create' })
				create(@route.path() id: string, @route.body() data: object) {
					return { id, data };
				}

				@route.del({ path: '/:id' })
				delete(@route.path() id: string) {
					return { id };
				}
			}

			const expressHttpServer = new ExpressHttpServer();
			app.registerController(MyController);
			app.registerModule(expressHttpServer);
			await app.init();

			const express = expressHttpServer.getInstance();

			expect(express._router.stack[2].route).to.have.property('path').equal('/');
			expect(express._router.stack[2].route).to.have.property('methods').deep.equal({ get: true });
			expect(express._router.stack[3].route).to.have.property('path').equal('/:id');
			expect(express._router.stack[3].route).to.have.property('methods').deep.equal({ patch: true });
			expect(express._router.stack[4].route).to.have.property('path').equal('/create');
			expect(express._router.stack[4].route).to.have.property('methods').deep.equal({ post: true });
			expect(express._router.stack[5].route).to.have.property('path').equal('/:id');
			expect(express._router.stack[5].route).to.have.property('methods').deep.equal({ delete: true });
		});
	});
});
