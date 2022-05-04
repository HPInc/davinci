/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { App, context, interceptor, InterceptorBag, InterceptorNext } from '@davinci/core';
import should from 'should';
import { HttpServerModule, route } from '../../src';
import * as http from 'http';
import { reflect } from '@davinci/reflector';

const sinon = require('sinon').createSandbox();

describe('HttpServerModule', () => {
	let app: App;

	type Request = { headers?: Record<string, string> };

	class DummyHttpServer extends HttpServerModule<Request> {
		onInit(app: App) {
			this.app = app;
		}
		get() {}
		post() {}
		head() {}
		delete() {}
		put() {}
		patch() {}
		all() {}
		options() {}
		listen() {}
		initHttpServer() {}
		setInstance() {}
		getInstance() {}
		reply(...args) {
			return args;
		}
		close() {}
		getRequestHostname() {}
		getRequestParameter({ source }) {
			return source;
		}
		getRequestMethod() {}
		getRequestHeaders(request) {
			return request.headers;
		}
		getRequestBody() {}
		getRequestQuerystring() {}
		getRequestUrl() {}
		status() {}
		redirect() {}
		setErrorHandler() {}
		setNotFoundHandler() {}
		setHeader() {}
	}

	beforeEach(() => {
		app = new App();
	});

	afterEach(async () => {
		await app.shutdown().catch(() => {});
		sinon.restore();
	});

	it('should be extended by http server modules', async () => {
		const dummyHttpServer = new DummyHttpServer({ port: 1234 });

		should(dummyHttpServer.getModuleId()).be.equal('http');
		should(dummyHttpServer.getModuleOptions()).be.deepEqual({ port: 1234 });
	});

	it('should be extended by http server modules', async () => {
		const dummyHttpServer = new DummyHttpServer({ port: 1234 });

		should(dummyHttpServer.getModuleId()).be.equal('http');
		should(dummyHttpServer.getModuleOptions()).be.deepEqual({ port: 1234 });
	});

	it('should be able to set and get the underlying http server instance', async () => {
		const dummyHttpServer = new DummyHttpServer({ port: 1234 });
		const httpServer = http.createServer(() => {});
		dummyHttpServer.setHttpServer(httpServer);

		should(dummyHttpServer.getHttpServer()).be.equal(httpServer);
	});

	describe('#createRoutes', () => {
		it('should introspect the controller and register the routes', async () => {
			@route.controller({ basePath: '/api/customers' })
			class CustomerController {
				@route.get({ path: '/all' })
				find() {}
				@route.post({ path: '/create' })
				create() {}
			}
			class MyDummyHttpServer extends DummyHttpServer {
				get(...args) {
					return ['get', ...args];
				}

				post(...args) {
					return ['post', ...args];
				}
			}
			const dummyHttpServer = new MyDummyHttpServer();
			await new App().registerController(CustomerController).registerModule(dummyHttpServer).init();
			const [[getRoute, postRoute]] = dummyHttpServer.createRoutes();

			should(getRoute[0]).be.equal('get');
			should(getRoute[1]).be.equal('/api/customers/all');
			should(postRoute[0]).be.equal('post');
			should(postRoute[1]).be.equal('/api/customers/create');
		});
	});

	describe('#createRequestHandler', () => {
		it('should create a request handler that execute successfully', async () => {
			@route.controller({ basePath: '/api/customers' })
			class CustomerController {
				@route.get({ path: '/all' })
				find(@route.body() body, @route.query() query) {
					return { body, query };
				}
			}
			const dummyHttpServer = new DummyHttpServer();
			const controllerReflection = reflect(CustomerController);
			const methodReflection = controllerReflection.methods[0];
			const requestHandler = dummyHttpServer.createRequestHandler(new CustomerController(), 'find', {
				controllerReflection,
				methodReflection
			});
			const reqMock = {};
			const resMock = {};
			const result = await requestHandler(reqMock, resMock);

			should(result[1]).be.deepEqual({
				body: 'body',
				query: 'query'
			});
		});

		it('should create a request handler that fails', async () => {
			@route.controller({ basePath: '/api/customers' })
			class CustomerController {
				@route.get({ path: '/all' })
				find(@route.body() body, @route.query() query) {
					throw new Error(`Bad request with arguments: ${body}, ${query}`);
				}
			}
			const dummyHttpServer = new DummyHttpServer();
			const controllerReflection = reflect(CustomerController);
			const methodReflection = controllerReflection.methods[0];
			const requestHandler = dummyHttpServer.createRequestHandler(new CustomerController(), 'find', {
				controllerReflection,
				methodReflection
			});
			const reqMock = {};
			const resMock = {};
			const result = await requestHandler(reqMock, resMock);

			should(result[1]).match({
				message: 'Bad request with arguments: body, query'
			});
		});

		it('should create a request handler that process interceptors', async () => {
			const interceptor1 = sinon.stub().callsFake(next => next());
			const interceptor2 = sinon.stub().callsFake(next => next());

			@interceptor(interceptor1)
			@route.controller({ basePath: '/api/customers' })
			class CustomerController {
				@interceptor(interceptor2)
				@route.get({ path: '/all' })
				find(@route.body() body, @route.query() query) {
					return { body, query };
				}
			}
			const dummyHttpServer = new DummyHttpServer();
			const controllerReflection = reflect(CustomerController);
			const methodReflection = controllerReflection.methods[0];
			const requestHandler = dummyHttpServer.createRequestHandler(new CustomerController(), 'find', {
				controllerReflection,
				methodReflection
			});
			const reqMock = {};
			const resMock = {};
			const result = await requestHandler(reqMock, resMock);

			should(result[1]).be.deepEqual({
				body: 'body',
				query: 'query'
			});
			should(interceptor1.called).be.True();
			should(interceptor2.called).be.True();
		});

		it('should be able to process the context parameter', async () => {
			@route.controller({ basePath: '/api/customers' })
			class CustomerController {
				@route.get({ path: '/all' })
				find(@route.body() body, @route.query() query, @context() ctx) {
					return { body, query, ctx };
				}
			}

			const contextFactory = sinon.stub().callsFake(({ request }) => ({ userId: request.headers['x-userid'] }));
			const dummyHttpServer = new DummyHttpServer().setContextFactory(contextFactory);
			const controllerReflection = reflect(CustomerController);
			const methodReflection = controllerReflection.methods[0];
			const requestHandler = dummyHttpServer.createRequestHandler(new CustomerController(), 'find', {
				controllerReflection,
				methodReflection
			});
			const reqMock = {
				headers: {
					'x-userid': '123'
				}
			};
			const resMock = {};
			const result = await requestHandler(reqMock, resMock);

			should(result[1]).be.match({
				body: 'body',
				query: 'query',
				ctx: {
					userId: '123'
				}
			});

			should(contextFactory.getCall(0).args[0]).have.property('reflection');
			should(contextFactory.getCall(0).args[0].reflection).have.properties([
				'controllerReflection',
				'methodReflection'
			]);
		});

		it('should inject the context as parameter in the interceptors', async () => {
			type Context = { userId: string };
			const handler = sinon.stub().callsFake((next: InterceptorNext<Context>, bag: InterceptorBag<Context>) => {
				should(bag.context).be.deepEqual({ userId: '123' });
				return next();
			});
			@interceptor(handler)
			class CustomerController {
				@interceptor(handler)
				@route.get({ path: '/all' })
				find(@route.body() body, @route.query() query, @context() ctx) {
					return { body, query, ctx };
				}
			}

			const contextFactory = sinon.stub().callsFake(({ request }) => ({ userId: request.headers['x-userid'] }));
			const dummyHttpServer = new DummyHttpServer().setContextFactory(contextFactory);
			const controllerReflection = reflect(CustomerController);
			const methodReflection = controllerReflection.methods[0];
			const requestHandler = dummyHttpServer.createRequestHandler(new CustomerController(), 'find', {
				controllerReflection,
				methodReflection
			});
			const reqMock = {
				headers: {
					'x-userid': '123'
				}
			};
			const resMock = {};
			await requestHandler(reqMock, resMock);
			should(handler.callCount).be.equal(2);
		});
	});
});
