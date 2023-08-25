/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { App } from '@davinci/core';
import { route } from '@davinci/http-server';
import { createSandbox } from 'sinon';
import { reflect } from '@davinci/reflector';
// eslint-disable-next-line import/no-unresolved
import { Hono } from 'hono';
import { expect } from '../support/chai';
import { HonoHttpServer } from '../../src';

const sinon = createSandbox();

describe('HonoHttpServer', () => {
	let app: App;

	beforeEach(() => {
		app = new App({ logger: { level: 'silent' } });
	});

	afterEach(async () => {
		await app.shutdown().catch(() => {});
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('lifecycle', () => {
		it('should reinit the module after destroy', async () => {
			const honoHttpServer = new HonoHttpServer({ port: 3000 });

			const onRegister = sinon.spy(honoHttpServer, 'onRegister');

			app.registerModule(honoHttpServer);
			await app.init();
			await app.shutdown();
			await app.init();

			const response = await app.locals.injectHttpRequest({ path: '/' });

			expect(response).to.have.property('statusCode').equal(404);
			expect(onRegister.callCount).to.equal(2);
		});

		it('should destroy the hono instance', async () => {
			const honoHttpServer = new HonoHttpServer({ port: 3000 });
			app.registerModule(honoHttpServer);

			await app.init();
			await app.shutdown().catch(err => err);

			await expect((async () => honoHttpServer.getInstance())()).to.be.rejectedWith('Instance not set, aborting');
		});
	});

	describe('instantiation', () => {
		it('should allow to pass hono instance factory in module options', async () => {
			const instance = new Hono();
			const honoHttpServer = new HonoHttpServer({ instance: () => instance });
			await app.registerModule(honoHttpServer);

			expect(honoHttpServer.instance).to.deep.equal(instance);
		});

		it('should allow to pass hono instance in module options', async () => {
			const instance = new Hono();
			const honoHttpServer = new HonoHttpServer({ port: 3000, instance });
			await app.registerModule(honoHttpServer);

			expect(honoHttpServer.instance).to.deep.equal(instance);
		});

		it('should create default hono instance', async () => {
			const honoHttpServer = new HonoHttpServer({ port: 3000 });
			await app.registerModule(honoHttpServer);

			expect(honoHttpServer.instance).to.exist;
		});

		it('should synchronously register the routes on the hono instance', async () => {
			class MyController {
				@route.get({ path: '/customers' })
				getAll() {
					return {};
				}
			}

			const instance = new Hono();
			const honoHttpServer = new HonoHttpServer({ instance: () => instance });
			app.registerController(MyController);

			// we don't wait for the module to be registered
			app.registerModule(honoHttpServer);
			app.init();

			expect(instance.routes).to.containSubset([
				{
					path: '/customers',
					method: 'GET'
				}
			]);

			expect(honoHttpServer.getInstance().routes).to.containSubset([
				{
					path: '/customers',
					method: 'GET'
				}
			]);
		});
	});

	describe('#createRequestHandler', () => {
		it('should create a request handler for a controller method that succeed', async () => {
			const honoHttpServer = new HonoHttpServer();
			class MyController {
				@route.get({ path: '/all' })
				getAll(
					@route.path() path: string,
					@route.query() filter: string,
					@route.body() body: object,
					@route.header({ name: 'x-accountid' }) accountId: string,
					@route.response() res,
					@route.request() req
				) {
					return { path, filter, body, accountId, res, req };
				}
			}
			const controller = new MyController();
			const replySpy = sinon.spy(honoHttpServer, 'reply');
			const controllerReflection = reflect(MyController);
			const methodReflection = controllerReflection.methods[0];
			const req = {
				param: () => 'path',
				query: () => 'myFilter',
				header: () => 123,
				json: () => ({ isBody: true })
			};

			const honoCtx = {
				json: sinon.stub(),
				req,
				status: () => {},
				get: () => ({ filter: 'myFilter' })
			};
			// const res = { status: sinon.stub(), send: sinon.stub(), json: sinon.stub() };
			const parametersConfig = await honoHttpServer.createParametersConfigurations({
				controllerReflection,
				methodReflection
			});

			const handler = await honoHttpServer.createRequestHandler(controller, 'getAll', {
				path: '/all',
				verb: 'get',
				parametersConfig,
				controllerReflection,
				methodReflection
			});
			// @ts-ignore
			await handler(honoCtx, honoCtx);

			expect(honoCtx.json.args[0][0]).to.containSubset({
				path: 'path',
				filter: 'myFilter',
				body: {
					isBody: true
				},
				accountId: 123
			});
			expect(replySpy.called).to.be.true;
		});

		it('should create a request handler for a controller method that fails', async () => {
			const honoHttpServer = new HonoHttpServer();
			class MyController {
				@route.get({ path: '/all' })
				getAll(@route.query() filter: string) {
					throw new Error('Invalid');
					return { filter };
				}
			}
			const controller = new MyController();
			const replySpy = sinon.spy(honoHttpServer, 'reply');
			const controllerReflection = reflect(MyController);
			const methodReflection = controllerReflection.methods[0];
			const req = {
				param: () => 'path',
				query: () => 'myFilter',
				header: () => 123,
				body: { isBody: true }
			};

			const honoCtx = {
				json: sinon.stub(),
				req,
				status: () => {},
				get: () => ({ filter: 'myFilter' })
			};
			const parametersConfig = await honoHttpServer.createParametersConfigurations({
				controllerReflection,
				methodReflection
			});

			const handler = await honoHttpServer.createRequestHandler(controller, 'getAll', {
				path: '/all',
				verb: 'get',
				parametersConfig,
				controllerReflection,
				methodReflection
			});
			// @ts-ignore
			await handler(honoCtx, honoCtx);

			expect(honoCtx.json.args[0][0]).to.containSubset({ error: true, message: 'Invalid' });
			expect(replySpy.called).to.be.true;
		});
	});

	describe('#createRoutes', () => {
		it('should walk the controller reflection and register routes in hono', async () => {
			class MyController {
				@route.get({ path: '/' })
				getAll(@route.query() filter: string) {
					return { filter };
				}

				@route.patch({ path: '/:id' })
				patch(@route.path() id: string, @route.body() data: object) {
					return { id, data };
				}

				@route.put({ path: '/:id' })
				put(@route.path() id: string, @route.body() data: object) {
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

				@route.head({ path: '/head' })
				head() {
					return {};
				}

				@route.options({ path: '/' })
				options() {
					return {};
				}
			}

			const honoHttpServer = new HonoHttpServer();
			app.registerController(MyController);
			app.registerModule(honoHttpServer);
			await app.init();

			const hono = honoHttpServer.getInstance();
			expect(hono.routes).to.containSubset([
				{
					path: '/',
					method: 'GET'
				},
				{
					path: '/:id',
					method: 'PATCH'
				},
				{
					path: '/:id',
					method: 'PUT'
				},
				{
					path: '/create',
					method: 'POST'
				},
				{
					path: '/:id',
					method: 'DELETE'
				},
				{
					path: '/',
					method: 'OPTIONS'
				}
			]);
		});
	});

	describe('propagation', () => {
		it('should propagate the calls to the underlying hono instance', async () => {
			const honoHttpServer = new HonoHttpServer({ logger: { level: 'silent' } });
			await honoHttpServer.initHttpServer();
			const hono = honoHttpServer.getInstance();
			const honoMocks = {
				// listen: sinon.stub(hono, 'listen'),
				post: sinon.stub(hono, 'post'),
				all: sinon.stub(hono, 'all')
				// register: sinon.stub(hono, 'register')
			};
			const cb = () => {};

			honoHttpServer.post('/', cb);
			expect(honoMocks.post.firstCall.args[0]).to.be.deep.equal('/');
			honoHttpServer.all('/', cb);
			expect(honoMocks.all.firstCall.args[0]).to.be.deep.equal('/');
			/* honoHttpServer.static('/', { redirect: true });
			expect(honoMocks.register.firstCall.args).to.be.deep.equal([
				honoStatic,
				{ root: '/', redirect: true }
			]); */
			/* honoHttpServer.listen();
			expect(honoMocks.listen.firstCall.args).to.be.deep.equal([{ port: 3000, host: '0.0.0.0' }]); */
		});

		it('should propagate the calls to the underlying response', async () => {
			const honoHttpServer = new HonoHttpServer();
			await honoHttpServer.initHttpServer();
			const responseMock = {
				redirect: sinon.stub(),
				set: sinon.stub(),
				header: sinon.stub()
			};

			// @ts-ignore
			honoHttpServer.redirect(responseMock, 301, 'http://redirect.url');
			expect(responseMock.redirect.firstCall.args).to.be.deep.equal(['http://redirect.url', 301]);
			// @ts-ignore
			honoHttpServer.setHeader(responseMock, 'x-my-header', '123');
			expect(responseMock.header.firstCall.args).to.be.deep.equal(['x-my-header', '123']);
		});
	});

	describe('#performHttpInject', () => {
		it('should perform the request injection', async () => {
			class MyController {
				@route.get({ path: '/customers' })
				getAll(@route.query() filter: string, @route.query() nested: object) {
					return { method: 'get', filter, nested };
				}

				@route.patch({ path: '/customers/:customerId' })
				update(@route.path() customerId: string, @route.body() data: object) {
					return { method: 'patch', customerId, data };
				}
			}

			const honoHttpServer = new HonoHttpServer();
			app.registerController(MyController);
			app.registerModule(honoHttpServer);
			await app.init();

			const result1 = await app.locals.injectHttpRequest({
				method: 'get',
				path: '/customers',
				query: { filter: 'active', 'nested[query]': '1' }
			});

			expect(result1).to.containSubset({
				statusCode: 200,
				payload: '{"method":"get","filter":"active","nested":{"query":"1"}}'
			});

			const result2 = await app.locals.injectHttpRequest({
				method: 'patch',
				path: '/customers/123',
				payload: { firstname: 'John' }
			});

			expect(result2).to.containSubset({
				headers: {
					'content-type': 'application/json; charset=UTF-8'
				},
				statusCode: 200,
				payload: '{"method":"patch","customerId":"123","data":{"firstname":"John"}}'
			});
		});
	});
});
