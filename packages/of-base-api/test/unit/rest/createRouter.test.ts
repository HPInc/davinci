import _ from 'lodash';
import should from 'should';
import Sinon from 'sinon';
import BaseController from '../../../src/BaseController';
import createRouter, { createRouteHandlers } from '../../../src/route/createRouter';
import { route } from '../../../src';
import * as utils from '../../support/utils';
import createPathsDefinition from '../../../src/route/swagger/createPaths';

const sinon = Sinon.createSandbox();

describe('createRouter', () => {
	afterEach(() => {
		sinon.reset();
	});
	describe('main function', () => {
		let TestController;

		beforeEach(() => {
			TestController = class extends BaseController {
				constructor(model) {
					super();
					this.model = model;
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

		it('should fail with invalid controller', done => {
			try {
				createRouter('this is the wrong type', 'test');
			} catch (err) {
				err.should.have.property('message').equal('Invalid Controller - not function');
				done();
			}
		});

		it('should succeed even with invalid controller definitions', done => {
			const model = {};
			utils.makeMockControllerClass(model, TestController);
			done();
		});

		it('should convert paths from swagger {x} to express :x format', done => {
			class ParamController extends BaseController {
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
	});

	/*
	 TODO: implement functionality to fix those
	describe('response definitions', () => {
		class MockController extends BaseController {
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
			TestController = class extends BaseController {
				constructor(model) {
					super();
					this.model = model;
				}

				syncMethod() {
					return 'result';
				}

				async asyncMethod() {
					return 'asyncResult';
				}
			};

			route.get({ path: '/syncMethod', summary: '' })(TestController.prototype, 'syncMethod');
			route.get({ path: '/asyncMethod', summary: '' })(TestController.prototype, 'asyncMethod');
		});

		it('should correctly coerce synchronous controller methods to return a promise', async () => {
			const model = {};
			const MockClass = utils.makeMockControllerClass(model, TestController);
			const definition = {
				paths: createPathsDefinition(MockClass)
			};
			const routeHandlers = createRouteHandlers(new MockClass(), definition);
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
				paths: createPathsDefinition(MockClass)
			};
			const routeHandlers = createRouteHandlers(new MockClass(), definition);
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
	});
});
