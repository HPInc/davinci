const should = require('should');
const express = require('express');
const _ = require('lodash');
const sinon = require('sinon').createSandbox();
const testDef = require('../support/test.def');
const BaseController = require('../../src/BaseController');
const createRouter = require('../../src/rest/createRouter');
const utils = require('../support/utils');

const { createRouteHandlers } = createRouter;

describe('createRouter', () => {
	afterEach(() => {
		sinon.restore();
	});
	describe('main function', () => {
		let TestController;

		beforeEach(() => {
			TestController = class extends BaseController {
				constructor({ model, def = {} }) {
					super();
					this.model = model;
					this.def = def;
				}
			};
		});

		it('should successfully create a router', done => {
			const model = {};
			const def = testDef;
			const mockClass = utils.makeMockControllerClass({ model, def }, TestController);
			const router = createRouter(mockClass, 'test');
			router.should.have.property('params');
			done();
		});

		it('should fail with missing controller', done => {
			const model = {};
			const def = testDef;
			try {
				const router = createRouter(null, 'test');
			} catch (err) {
				err.should.have.property('message').equal('Invalid Controller - missing Controller');
				done();
			}
		});

		it('should fail with invalid controller', done => {
			const model = {};
			const def = testDef;
			try {
				const router = createRouter('this is the wrong type', 'test');
			} catch (err) {
				err.should.have.property('message').equal('Invalid Controller - not function');
				done();
			}
		});

		it('should succeed even with invalid controller definitions', done => {
			const model = {};
			const def = null;
			const mockClass = utils.makeMockControllerClass({ model, def }, TestController);
			done();
		});

		it('should convert paths from swagger {x} to express :x format', done => {
			const def = {
				paths: {
					'/{id}': {
						put: {
							summary: 'First Thing',
							operationId: 'update'
						}
					},
					'/{one}/{two}': {
						get: {
							summary: 'Another Thing',
							operationId: 'update'
						}
					}
				}
			};

			class ParamController extends BaseController {
				constructor() {
					super(def);
				}
			}

			const router = createRouter(ParamController);

			router.should.have.property('stack').of.length(2);
			router.stack[0].should.have.property('route');
			router.stack[0].route.should.have.property('path').equal('/:id');
			router.stack[1].should.have.property('route');
			router.stack[1].route.should.have.property('path').equal('/:one/:two');
			done();
		});
	});

	describe('response definitions', () => {
		const mockDef = {
			paths: {
				'/test': {
					get: {
						summary: 'Testing given success response code',
						operationId: 'test',
						responses: {
							201: {
								description: 'Created something'
							},
							429: {
								description: 'Slow down!'
							}
						}
					},
					put: {
						summary: 'Testing default response code',
						operationId: 'test',
						responses: {}
					}
				}
			}
		};
		class MockController extends BaseController {
			constructor({ def = mockDef } = {}) {
				super(def, null);
			}

			async test({}) {
				return {};
			}
		}

		it('should use the specified success response code', async () => {
			const router = createRouter(MockController);

			const req = {};
			const res = {
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
	});

	describe('createRouteHandlers', () => {
		let TestController;
		beforeEach(() => {
			TestController = class extends BaseController {
				constructor({ model, def = {} }) {
					super();
					this.model = model;
					this.def = def;
				}

				syncMethod() {
					return 'result';
				}

				async asyncMethod() {
					return 'asyncResult';
				}
			};
		});

		it('should correctly coerce synchronous controller methods to return a promise', async () => {
			const model = {};
			const def = testDef;
			const MockClass = utils.makeMockControllerClass({ model, def }, TestController);
			const handlers = createRouteHandlers(new MockClass());
			const { handler: synchronousHandler } = _.find(handlers, { path: '/syncMethod' });
			const reqMock = { body: {} };
			const resMock = {};
			resMock.status = sinon.stub().returns(resMock);
			resMock.json = sinon.stub();
			const promise = synchronousHandler(reqMock, resMock);
			promise.should.be.a.Promise();
			await promise;
			resMock.json.firstCall.args[0].should.be.equal('result');
		});

		it('should correctly handle asynchronous controller methods', async () => {
			const model = {};
			const def = testDef;
			const MockClass = utils.makeMockControllerClass({ model, def }, TestController);
			const handlers = createRouteHandlers(new MockClass());
			const { handler: asynchronousHandler } = _.find(handlers, { path: '/asyncMethod' });
			const reqMock = { body: {} };
			const resMock = {};
			resMock.status = sinon.stub().returns(resMock);
			resMock.json = sinon.stub();
			const promise = asynchronousHandler(reqMock, resMock);
			promise.should.be.a.Promise();
			await promise;
			resMock.json.firstCall.args[0].should.be.equal('asyncResult');
		});
	});
});
