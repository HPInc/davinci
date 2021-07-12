import _ from 'lodash';
import Ajv from 'ajv';
import should from 'should';
import Sinon from 'sinon';
import express from 'express';
import MongooseController from '../../support/MongooseController';
import createRouter, { createRouteHandlers } from '../../../src/route/createRouter';
import { route, openapi } from '../../../src/route';
import * as utils from '../../support/utils';
import createPathsDefinition from '../../../src/route/openapi/createPaths';

const sinon = Sinon.createSandbox();

describe('createRouter', () => {
	afterEach(() => {
		sinon.reset();
	});
	describe('main function', () => {
		let TestController;

		beforeEach(() => {
			TestController = class extends MongooseController {
				constructor(model) {
					super(model);
				}
			};
		});

		it('should successfully create a router', done => {
			const model = {};
			const mockClass = utils.makeMockControllerClass(model, TestController);
			const router = createRouter(mockClass, 'test');
			should(router).have.property('params');
			should(router.name).be.equal('router');
			done();
		});

		it('should fail with missing controller', done => {
			try {
				createRouter(null, 'test');
			} catch (err) {
				err.should.have.property('message').equal('Invalid Controller - missing Controller');
				done();
			}
		});

		it('should succeed even with invalid controller definitions', done => {
			const model = {};
			utils.makeMockControllerClass(model, TestController);
			done();
		});

		it('should convert paths from swagger {x} to express :x format', done => {
			class ParamController extends MongooseController {
				constructor() {
					super();
				}
			}

			const router = createRouter(ParamController);

			should(router)
				.have.property('stack')
				.of.length(5);
			router.stack[0].should.have.property('route');
			router.stack[0].route.should.have.property('path').equal('/:id');
			router.stack[0].route.should.have.property('methods').deepEqual({ delete: true });
			done();
		});

		it('should register the routes to the router instance provided as parameter', () => {
			let app = express();

			@route.controller({ basepath: '/api/test' })
			class TestController {
				@route.get({ path: '/hello', summary: 'Find' })
				find() {}
			}
			const router = createRouter(TestController, 'test', null, app);

			should(router).be.equal(app);
			should(app._router.stack[2].route).match({
				path: '/api/test/hello',
				methods: {
					get: true
				}
			});
		});

		it('should accept ajv factory provided as parameter', () => {
			const model = {};
			const mockClass = utils.makeMockControllerClass(model, TestController);
			const factory = () =>
				new Ajv({
					allErrors: true,
					coerceTypes: true,
					useDefaults: true,
					removeAdditional: 'all'
				});
			const router = createRouter({
				Controller: mockClass,
				resourceName: 'test',
				contextFactory: null,
				router: undefined,
				ajvFactory: factory
			});
			should(router).have.property('params');
			should(router.name).be.equal('router');
		});
	});

	/*
	 TODO: implement functionality to fix those
	describe('response definitions', () => {
		class MockController extends MongooseController {
			constructor() {
				super();
			}

			async test({}) {
				return {};
			}
		}

		it('should use the specified success response code', async () => {
			const router = createRouter(MockController);

			const req = {
				params: {}
			};
			const res = {
				statusCode: null,
				status: code => {
					res.statusCode = +code;
					return res;
				},
				json: () => {
					return res;
				},
				end: () => {}
			};

			await router.stack[0].route.stack[0].handle(req, res);
			res.statusCode.should.equal(201);
		});

		it('should use a default response code when none specified', async () => {
			const router = createRouter(MockController);

			const req = {};
			const res = {
				statusCode: null,
				status: code => {
					res.statusCode = +code;
					return res;
				},
				json: () => {
					return res;
				},
				end: () => {}
			};

			await router.stack[1].route.stack[0].handle(req, res);
			res.statusCode.should.equal(200);
		});
	});*/

	describe('createRouteHandlers', () => {
		let TestController;

		beforeEach(() => {
			TestController = class extends MongooseController {
				constructor(model) {
					super(model);
				}

				syncMethod() {
					return 'result';
				}

				async asyncMethod() {
					return 'asyncResult';
				}
			};

			route.get({ path: '/syncMethod', summary: '' })(TestController.prototype, 'syncMethod', null);
			route.get({ path: '/asyncMethod', summary: '' })(TestController.prototype, 'asyncMethod', null);
		});

		it('should correctly coerce synchronous controller methods to return a promise', async () => {
			const model = {};
			const MockClass = utils.makeMockControllerClass(model, TestController);
			const definition = {
				paths: createPathsDefinition(MockClass).paths
			};
			const routeHandlers = createRouteHandlers(new MockClass(), definition, {});
			// @ts-ignore
			const { handlers } = _.find(routeHandlers, { path: '/syncMethod' });
			const synchronousHandler = handlers[0];
			const reqMock = { body: {}, result: null, statusCode: null };
			const resMock = {
				status: null,
				json: null
			};
			const nextMock = () => {};
			const promise = synchronousHandler(reqMock, resMock, nextMock);
			promise.should.be.a.Promise();
			await promise;
			reqMock.result.should.be.equal('result');
		});

		it('should correctly handle asynchronous controller methods', async () => {
			const model = {};
			const MockClass = utils.makeMockControllerClass(model, TestController);
			const definition = {
				paths: createPathsDefinition(MockClass).paths
			};
			const routeHandlers = createRouteHandlers(new MockClass(), definition, {});
			// @ts-ignore
			const { handlers } = _.find(routeHandlers, { path: '/asyncMethod' });
			const asynchronousHandler = handlers[0];
			const reqMock = { body: {}, result: null, statusCode: null };
			const resMock = {
				status: null,
				json: null
			};
			const nextMock = () => {};
			const promise = asynchronousHandler(reqMock, resMock, nextMock);
			promise.should.be.a.Promise();
			await promise;
			reqMock.result.should.be.equal('asyncResult');
		});

		it('should correctly strip out the `hidden` property for definitions, before feed it to AJV', async () => {
			const model = {};

			@openapi.definition({ title: 'Test', hidden: true })
			class MySchema {
				@openapi.prop()
				name: string;
			}
			class MyController {
				@route.post({ path: '/createSomething', summary: '' })
				createSomething(@route.body() data: MySchema) {
					return data;
				}
			}

			const MockClass = utils.makeMockControllerClass(model, MyController);
			const definition = createPathsDefinition(MockClass);
			const routeHandlers = createRouteHandlers(new MockClass(), definition, {});
			// @ts-ignore
			const handler = _.find(routeHandlers, { path: '/createSomething' }).handlers[0];
			const reqMock = { body: { name: 'test' }, result: null, statusCode: null };
			const resMock = {
				status: null,
				json: null
			};
			const nextMock = () => {};
			const promise = handler(reqMock, resMock, nextMock);
			promise.should.be.a.Promise();
			await promise;
			reqMock.result.should.be.deepEqual(reqMock.body);
		});

		it('should use the ajv factory provided as parameter', async () => {
			const factory = () =>
				new Ajv({
					allErrors: true,
					coerceTypes: true,
					useDefaults: true,
					removeAdditional: 'all'
				});
			const factorySpy = sinon.spy(factory);

			const model = {};

			@openapi.definition({ title: 'Test', hidden: true })
			class MySchema {
				@openapi.prop()
				name: string;
			}
			class MyController {
				@route.post({ path: '/createSomething', summary: '' })
				createSomething(@route.body() data: MySchema) {
					return data;
				}
			}

			const MockClass = utils.makeMockControllerClass(model, MyController);
			const definition = createPathsDefinition(MockClass);
			const routeHandlers = createRouteHandlers(new MockClass(), definition, {}, undefined, factorySpy);
			// @ts-ignore
			const handler = _.find(routeHandlers, { path: '/createSomething' }).handlers[0];
			const reqMock = { body: { name: 'test' }, result: null, statusCode: null };
			await handler(reqMock, {}, () => {});
			factorySpy.callCount.should.be.equal(1);
		});
	});
});
