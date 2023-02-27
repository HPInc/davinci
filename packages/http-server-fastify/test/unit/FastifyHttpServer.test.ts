/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { App } from '@davinci/core';
import { route } from '@davinci/http-server';
import axios from 'axios';
import { createSandbox } from 'sinon';
import { reflect } from '@davinci/reflector';
import fastifyStatic from '@fastify/static';
import fastify from 'fastify';
import { expect } from '../support/chai';
import { FastifyHttpServer } from '../../src';

const sinon = createSandbox();

describe('FastifyHttpServer', () => {
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
		it('should be reinit the module after destroy', async () => {
			const fastifyHttpServer = new FastifyHttpServer({ port: 3000 });
			app.registerModule(fastifyHttpServer);

			const onRegister = sinon.spy(fastifyHttpServer, 'onRegister');

			await app.init();
			await app.shutdown();
			await app.init();

			const { error } = await axios
				.get('http://127.0.0.1:3000')
				.then(response => ({ error: null, response }))
				.catch(error => ({ error }));

			expect(error.response).to.have.property('status').equal(404);
			expect(onRegister.callCount).to.equal(2);
		});

		it('should initialize a listening server', async () => {
			const fastifyHttpServer = new FastifyHttpServer({ port: 3000 });
			app.registerModule(fastifyHttpServer);

			await app.init();

			const { error } = await axios
				.get('http://127.0.0.1:3000')
				.then(response => ({ error: null, response }))
				.catch(error => ({ error }));

			expect(error.response).to.have.property('status').equal(404);
		});

		it('should shutdown the listening server', async () => {
			const fastifyHttpServer = new FastifyHttpServer({ port: 3000 });
			app.registerModule(fastifyHttpServer);

			await app.init();
			await app.shutdown().catch(err => err);

			const { error } = await axios
				.get('http://127.0.0.1:3000')
				.then(response => ({ error: null, response }))
				.catch(error => ({ error }));

			expect(error.response).to.be.undefined;
			expect(error.code).be.equal('ECONNREFUSED');
		});
	});

	describe('instantiation', () => {
		it('should allow to pass fastify instance factory in module options', async () => {
			const instance = fastify();
			const fastifyHttpServer = new FastifyHttpServer({ port: 3000, instance: () => instance });
			await app.registerModule(fastifyHttpServer);

			expect(fastifyHttpServer.instance).to.deep.equal(instance);
		});

		it('should allow to pass fastify instance in module options', async () => {
			const instance = fastify();
			const fastifyHttpServer = new FastifyHttpServer({ port: 3000, instance });
			await app.registerModule(fastifyHttpServer);

			expect(fastifyHttpServer.instance).to.deep.equal(instance);
		});

		it('should create default fastify instance', async () => {
			const fastifyHttpServer = new FastifyHttpServer({ port: 3000 });
			await app.registerModule(fastifyHttpServer);

			expect(fastifyHttpServer.instance.server).to.exist;
		});
	});

	describe('#createRequestHandler', () => {
		it('should create a request handler for a controller method that succeed', async () => {
			const fastifyHttpServer = new FastifyHttpServer();
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
			const replySpy = sinon.spy(fastifyHttpServer, 'reply');
			const controllerReflection = reflect(MyController);
			const methodReflection = controllerReflection.methods[0];
			const req = {
				params: { path: 'path' },
				query: { filter: 'myFilter' },
				headers: { 'x-accountid': 123 },
				body: { isBody: true }
			};
			const res = { status: sinon.stub(), send: sinon.stub(), json: sinon.stub() };
			const parametersConfig = await fastifyHttpServer.createParametersConfigurations({
				controllerReflection,
				methodReflection
			});

			const handler = await fastifyHttpServer.createRequestHandler(controller, 'getAll', {
				path: '/all',
				verb: 'get',
				parametersConfig,
				controllerReflection,
				methodReflection
			});
			// @ts-ignore
			await handler(req, res);

			expect(res.send.args[0][0]).to.be.deep.equal({
				path: 'path',
				accountId: 123,
				body: {
					isBody: true
				},
				filter: 'myFilter',
				req,
				res
			});
			expect(replySpy.called).to.be.true;
		});

		it('should create a request handler for a controller method that fails', async () => {
			const fastifyHttpServer = new FastifyHttpServer();
			class MyController {
				@route.get({ path: '/all' })
				getAll(@route.query() filter: string) {
					throw new Error('Invalid');
					return { filter };
				}
			}
			const controller = new MyController();
			const replySpy = sinon.spy(fastifyHttpServer, 'reply');
			const controllerReflection = reflect(MyController);
			const methodReflection = controllerReflection.methods[0];
			const req = { query: { filter: 'myFilter' } };
			const res = { status: sinon.stub(), send: sinon.stub(), json: sinon.stub() };
			const parametersConfig = await fastifyHttpServer.createParametersConfigurations({
				controllerReflection,
				methodReflection
			});

			const handler = await fastifyHttpServer.createRequestHandler(controller, 'getAll', {
				path: '/all',
				verb: 'get',
				parametersConfig,
				controllerReflection,
				methodReflection
			});
			// @ts-ignore
			await handler(req, res);

			expect(res.status.args[0][0]).to.be.equal(500);
			expect(res.send.args[0][0]).to.containSubset({ error: true, message: 'Invalid' });
			expect(replySpy.called).to.be.true;
		});
	});

	describe('#createRoutes', () => {
		it('should walk the controller reflection and register routes in fastify', async () => {
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

			const fastifyHttpServer = new FastifyHttpServer();
			app.registerController(MyController);
			app.registerModule(fastifyHttpServer);
			await app.init();

			const fastify = fastifyHttpServer.getInstance();
			expect(fastify.printRoutes()).to.be.equal(
				'└── / (GET)\n' +
					'    / (HEAD)\n' +
					'    / (OPTIONS)\n' +
					'    ├── head (HEAD)\n' +
					'    ├── :id (PATCH)\n' +
					'    │   :id (PUT)\n' +
					'    │   :id (DELETE)\n' +
					'    └── create (POST)\n'
			);
		});
	});

	describe('propagation', () => {
		it('should propagate the calls to the underlying fastify instance', async () => {
			const fastifyHttpServer = new FastifyHttpServer({ logger: { level: 'silent' } });
			await fastifyHttpServer.initHttpServer();
			const fastify = fastifyHttpServer.getInstance();
			const fastifyMocks = {
				listen: sinon.stub(fastify, 'listen'),
				post: sinon.stub(fastify, 'post'),
				all: sinon.stub(fastify, 'all'),
				register: sinon.stub(fastify, 'register')
			};
			const cb = () => {};

			fastifyHttpServer.post('/', cb);
			expect(fastifyMocks.post.firstCall.args).to.be.deep.equal(['/', cb]);
			fastifyHttpServer.all('/', cb);
			expect(fastifyMocks.all.firstCall.args).to.be.deep.equal(['/', cb]);
			fastifyHttpServer.static('/', { redirect: true });
			expect(fastifyMocks.register.firstCall.args).to.be.deep.equal([
				fastifyStatic,
				{ root: '/', redirect: true }
			]);
			fastifyHttpServer.listen();
			expect(fastifyMocks.listen.firstCall.args).to.be.deep.equal([{ port: 3000, host: '0.0.0.0' }]);
		});

		it('should propagate the calls to the underlying response', async () => {
			const fastifyHttpServer = new FastifyHttpServer();
			await fastifyHttpServer.initHttpServer();
			const responseMock = {
				status: sinon.stub(),
				redirect: sinon.stub(),
				set: sinon.stub(),
				header: sinon.stub()
			};

			// @ts-ignore
			fastifyHttpServer.status(responseMock, 200);
			expect(responseMock.status.firstCall.args).to.be.deep.equal([200]);
			// @ts-ignore
			fastifyHttpServer.redirect(responseMock, 301, 'http://redirect.url');
			expect(responseMock.redirect.firstCall.args).to.be.deep.equal([301, 'http://redirect.url']);
			// @ts-ignore
			fastifyHttpServer.setHeader(responseMock, 'x-my-header', '123');
			expect(responseMock.header.firstCall.args).to.be.deep.equal(['x-my-header', '123']);
		});
	});

	describe('#performHttpInject', () => {
		it('should perform the request injection', async () => {
			class MyController {
				@route.get({ path: '/customers' })
				getAll(@route.query() filter: string) {
					return { method: 'get', filter };
				}

				@route.patch({ path: '/customers/:customerId' })
				update(@route.path() customerId: string, @route.body() data: object) {
					return { method: 'patch', customerId, data };
				}
			}

			const fastityHttpServer = new FastifyHttpServer();
			app.registerController(MyController);
			app.registerModule(fastityHttpServer);
			await app.init();

			const result1 = await app.locals.injectHttpRequest({
				method: 'get',
				path: '/customers',
				query: { filter: 'active' }
			});

			expect(result1).to.containSubset({
				headers: {
					'content-type': 'application/json; charset=utf-8'
				},
				statusCode: 200,
				payload: '{"method":"get","filter":"active"}'
			});

			const result2 = await app.locals.injectHttpRequest({
				method: 'patch',
				path: '/customers/123',
				payload: { firstname: 'John' }
			});

			expect(result2).to.containSubset({
				headers: {
					'content-type': 'application/json; charset=utf-8'
				},
				statusCode: 200,
				payload: '{"method":"patch","customerId":"123","data":{"firstname":"John"}}'
			});
		});
	});
});
