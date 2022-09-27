/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import {
	App,
	context,
	entity,
	executeInterceptorsStack,
	interceptor,
	InterceptorBag,
	InterceptorNext
} from '@davinci/core';
import * as http from 'http';
import { reflect } from '@davinci/reflector';
import { HttpServerModule, ParameterConfiguration, route } from '../../src';
import { expect } from '../support/chai';

const sinon = require('sinon').createSandbox();

describe('HttpServerModule', () => {
	let app: App;

	type Request = {
		headers?: Record<string, string>;
		body?: string | Record<string, unknown>;
		query?: Record<string, string>;
	};

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
		getRequestParameter(args) {
			const { source, name, request, response } = args;
			switch (source) {
				case 'path':
					return request.params[name];

				case 'header':
					return request.header(name);

				case 'query':
					return request.query[name];

				case 'body':
					return request.body;

				case 'request':
					return request;

				case 'response':
					return response;

				default:
					return undefined;
			}
			return source;
		}
		getRequestMethod() {}
		getRequestHeaders(request) {
			return request.headers;
		}
		getRequestBody(request) {
			return request.body;
		}
		getRequestQuerystring(request) {
			return request.query;
		}
		getRequestUrl(request) {
			return request.originalUrl;
		}
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

		expect(dummyHttpServer.getModuleId()).to.be.equal('http');
		expect(dummyHttpServer.getModuleOptions()).to.be.deep.equal({ port: 1234 });
	});

	it('should be extended by http server modules', async () => {
		const dummyHttpServer = new DummyHttpServer({ port: 1234 });

		expect(dummyHttpServer.getModuleId()).to.be.equal('http');
		expect(dummyHttpServer.getModuleOptions()).to.be.deep.equal({ port: 1234 });
	});

	it('should be able to set and get the underlying http server instance', async () => {
		const dummyHttpServer = new DummyHttpServer({ port: 1234 });
		const httpServer = http.createServer(() => {});
		dummyHttpServer.setHttpServer(httpServer);

		expect(dummyHttpServer.getHttpServer()).to.be.equal(httpServer);
	});

	describe('#createRoutes', () => {
		it('should introspect the controller and register the routes', async () => {
			@route.controller({ basePath: '/api/customers' })
			class CustomerController {
				@route.get({ path: '/all' })
				find() {}
				@route.post({ path: '/create/' })
				create() {}
			}
			class MyDummyHttpServer extends DummyHttpServer {
				onRegister(app: App) {
					this.app = app;
				}

				get(...args) {
					return ['get', ...args];
				}

				post(...args) {
					return ['post', ...args];
				}
			}
			const dummyHttpServer = new MyDummyHttpServer();
			await new App().registerController(CustomerController).registerModule(dummyHttpServer);
			await app.init();
			const [[getRoute, postRoute]] = await dummyHttpServer.createRoutes();

			expect(getRoute[0]).to.be.equal('get');
			expect(getRoute[1]).to.be.equal('/api/customers/all');
			expect(postRoute[0]).to.be.equal('post');
			expect(postRoute[1]).to.be.equal('/api/customers/create');
		});
	});

	describe('#createRequestHandler', () => {
		it('should create a request handler that execute successfully', async () => {
			@route.controller({ basePath: '/api/customers' })
			class CustomerController {
				@route.get({ path: '/all' })
				find(@route.body() body, @route.query() where: string, @route.request() req, @route.response() res) {
					return { body, where, req, res };
				}
			}
			const dummyHttpServer = new DummyHttpServer();
			const controllerReflection = reflect(CustomerController);
			const methodReflection = controllerReflection.methods[0];
			const requestHandler = await dummyHttpServer.createRequestHandler(
				new CustomerController(),
				'find',
				dummyHttpServer.createParametersConfigurations({ controllerReflection, methodReflection }),
				{
					controllerReflection,
					methodReflection
				}
			);
			const reqMock: Request = { body: {}, query: { where: '' } };
			const resMock = {};
			const result = await requestHandler(reqMock, resMock);

			expect(result[1]).to.be.deep.equal({
				body: {},
				where: '',
				req: reqMock,
				res: resMock
			});
		});

		it('should create a request handler that fails', async () => {
			@route.controller({ basePath: '/api/customers' })
			class CustomerController {
				@route.get({ path: '/all' })
				find(@route.body() body: string, @route.query() where: string) {
					throw new Error(`Bad request with arguments: ${body}, ${where}`);
				}
			}
			const dummyHttpServer = new DummyHttpServer();
			const controllerReflection = reflect(CustomerController);
			const methodReflection = controllerReflection.methods[0];
			const requestHandler = await dummyHttpServer.createRequestHandler(
				new CustomerController(),
				'find',
				dummyHttpServer.createParametersConfigurations({ controllerReflection, methodReflection }),
				{
					controllerReflection,
					methodReflection
				}
			);
			const reqMock = { body: 'body', query: { where: 'where' } };
			const resMock = {};
			const result = await requestHandler(reqMock, resMock);

			expect(result[1]).to.containSubset({
				message: 'Bad request with arguments: body, where'
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
				find(@route.body() body, @route.query() where: string) {
					return { body, where };
				}
			}
			const dummyHttpServer = new DummyHttpServer();
			const controllerReflection = reflect(CustomerController);
			const methodReflection = controllerReflection.methods[0];
			const requestHandler = await dummyHttpServer.createRequestHandler(
				new CustomerController(),
				'find',
				dummyHttpServer.createParametersConfigurations({ controllerReflection, methodReflection }),
				{
					controllerReflection,
					methodReflection
				}
			);
			const reqMock = {
				headers: { 'x-my-header': '1' },
				body: { myBody: true },
				query: { where: 'where' },
				originalUrl: 'http://path/to/url'
			};
			const resMock = {};
			const result = await requestHandler(reqMock, resMock);

			expect(result[1]).to.be.deep.equal({
				body: {
					myBody: true
				},
				where: 'where'
			});
			expect(interceptor1.called).to.be.true;
			const interceptorArgs = {
				module: 'http-server',
				handlerArgs: [
					{
						myBody: true
					},
					'where'
				],
				context: undefined,
				request: {
					headers: {
						'x-my-header': '1'
					},
					body: {
						myBody: true
					},
					query: {
						where: 'where'
					},
					url: 'http://path/to/url'
				},
				state: {}
			};
			expect(interceptor1.getCall(0).args[1]).to.be.deep.equal(interceptorArgs);
			expect(interceptor2.called).to.be.true;
			expect(interceptor2.getCall(0).args[1]).to.be.deep.equal(interceptorArgs);
		});

		it('should be able to process the context parameter', async () => {
			@route.controller({ basePath: '/api/customers' })
			class CustomerController {
				@route.get({ path: '/all' })
				find(@route.body() body: object, @route.query() where: string, @context() ctx) {
					return { body, where, ctx };
				}
			}

			const contextFactory = sinon.stub().callsFake(({ request }) => ({ userId: request.headers['x-userid'] }));
			const dummyHttpServer = new DummyHttpServer().setContextFactory(contextFactory);
			const controllerReflection = reflect(CustomerController);
			const methodReflection = controllerReflection.methods[0];
			const requestHandler = await dummyHttpServer.createRequestHandler(
				new CustomerController(),
				'find',
				dummyHttpServer.createParametersConfigurations({ controllerReflection, methodReflection }),
				{
					controllerReflection,
					methodReflection
				}
			);
			const reqMock = {
				body: { prop: true },
				query: {
					where: 'where'
				},
				headers: {
					'x-userid': '123'
				}
			};
			const resMock = {};
			const result = await requestHandler(reqMock, resMock);

			expect(result[1]).to.containSubset({
				body: { prop: true },
				where: 'where',
				ctx: {
					userId: '123'
				}
			});

			expect(contextFactory.getCall(0).args[0]).have.property('reflection');
			expect(contextFactory.getCall(0).args[0].reflection).haveOwnProperty('controllerReflection');
			expect(contextFactory.getCall(0).args[0].reflection).haveOwnProperty('methodReflection');
		});

		it('should inject the context as parameter in the interceptors', async () => {
			type Context = { userId: string };
			const handler = sinon.stub().callsFake((next: InterceptorNext<Context>, bag: InterceptorBag<Context>) => {
				expect(bag.context).to.be.deep.equal({ userId: '123' });
				return next();
			});

			@interceptor(handler)
			class CustomerController {
				@interceptor(handler)
				@route.get({ path: '/all' })
				find(@route.body() body, @route.query() where: string, @context() ctx) {
					return { body, where, ctx };
				}
			}

			const contextFactory = sinon.stub().callsFake(({ request }) => ({ userId: request.headers['x-userid'] }));
			const dummyHttpServer = new DummyHttpServer().setContextFactory(contextFactory);
			const controllerReflection = reflect(CustomerController);
			const methodReflection = controllerReflection.methods[0];
			const requestHandler = await dummyHttpServer.createRequestHandler(
				new CustomerController(),
				'find',
				dummyHttpServer.createParametersConfigurations({ controllerReflection, methodReflection }),
				{
					controllerReflection,
					methodReflection
				}
			);
			const reqMock = {
				body: { prop: true },
				query: {
					where: 'where'
				},
				headers: {
					'x-userid': '123'
				}
			};
			const resMock = {};
			await requestHandler(reqMock, resMock);
			expect(handler.callCount).to.be.equal(2);
		});

		it('should log exceptions happening in the contextFactory', async () => {
			class CustomerController {
				@route.get({ path: '/all' })
				find(@route.body() body, @route.query() query, @context() ctx) {
					return { body, query, ctx };
				}
			}

			const contextFactory = sinon.stub().callsFake(() => {
				throw new Error('A bad error here');
			});
			const dummyHttpServer = new DummyHttpServer().setContextFactory(contextFactory);
			const errorMock = sinon.stub(dummyHttpServer.logger, 'error');
			const controllerReflection = reflect(CustomerController);
			const methodReflection = controllerReflection.methods[0];
			const requestHandler = await dummyHttpServer.createRequestHandler(
				new CustomerController(),
				'find',
				dummyHttpServer.createParametersConfigurations({ controllerReflection, methodReflection }),
				{
					controllerReflection,
					methodReflection
				}
			);
			await requestHandler({}, {});
			expect(errorMock.getCall(0).args[1]).to.be.equal('An error happened during the creation of the context');
		});
	});

	describe('#createParametersConfigurations', () => {
		it('should generate the configuration for method parameters', () => {
			@entity()
			class Customer {
				@entity.prop()
				firstname: string;

				@entity.prop()
				lastname: string;
			}

			@route.controller({ basePath: '/customers' })
			class CustomerController {
				@route.get({ path: '/:id' })
				updateById(
					@route.body() body: Customer,
					@route.query() query: string,
					@route.request() req,
					@route.response() res,
					@context() ctx
				) {
					return { body, query, req, res, ctx };
				}
			}

			const dummyHttpServer = new DummyHttpServer();
			const controllerReflection = reflect(CustomerController);
			const methodReflection = controllerReflection.methods.find(({ name }) => name === 'updateById');

			const parameterConfigurations = dummyHttpServer.createParametersConfigurations({
				controllerReflection,
				methodReflection
			});

			expect(parameterConfigurations).to.containSubset([
				{
					source: 'body',
					name: 'body',
					options: {
						in: 'body'
					}
				},
				{
					source: 'query',
					name: 'query',
					type: String,
					options: {
						in: 'query'
					}
				},
				{
					source: 'request'
				},
				{
					source: 'response'
				},
				{
					source: 'context',
					reflection: {
						controllerReflection,
						methodReflection
					}
				}
			]);
			expect(parameterConfigurations[0]).haveOwnProperty('type').to.be.equal(Customer);
		});
	});

	describe('#createValidationInterceptor', () => {
		it('should create a validation interceptor', async () => {
			// arrange
			const dummyHttpServer = new DummyHttpServer();
			const parametersConfig: ParameterConfiguration<any>[] = [
				{ name: 'customerId', source: 'path', type: Number, value: { firstname: '4000' } },
				{ name: 'data', source: 'body', type: Object, value: { firstname: 'John' } },
				{ name: 'street', source: 'query', type: String, value: 'My Road' },
				{
					name: 'houseNumber',
					source: 'query',
					type: String,
					options: { in: 'query', required: true },
					value: '20'
				},
				{ name: 'accountId', source: 'header', type: Number, value: '1000' }
			];
			const validatorFunction = sinon.stub();
			const validationInterceptor = await dummyHttpServer.createValidationInterceptor({
				validatorFunction,
				parametersConfig
			});

			//act
			await executeInterceptorsStack([validationInterceptor]);

			//assert
			expect(validatorFunction.called).to.be.true;
			expect(validatorFunction.getCall(0).args[0]).to.be.deep.equal({
				params: {
					customerId: {
						firstname: '4000'
					}
				},
				body: {
					firstname: 'John'
				},
				querystring: {
					street: 'My Road',
					houseNumber: '20'
				},
				headers: {
					accountId: '1000'
				}
			});
		});
	});
});
