/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { App, interceptor } from '@davinci/core';
import should from 'should';
import { HttpServerModule, route } from '../../src';
import * as http from 'http';
import { reflect } from '@davinci/reflector';

const sinon = require('sinon').createSandbox();

describe('HttpServerModule', () => {
	let app: App;

	class DummyHttpServer extends HttpServerModule {
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
		getRequestHeaders() {}
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
	});
});
