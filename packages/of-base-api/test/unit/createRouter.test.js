const should = require('should');
const express = require('express');
const testDef = require('../support/test.def');
const BaseController = require('../../src/BaseController');
const createRouter = require('../../src/createRouter');
const utils = require('../support/utils');

class TestController extends BaseController {
	constructor({ model, def = {}}) {
		super();
		this.model = model;
		this.def = def;
	}
}

describe('createRouter', () => {

	it('should successfully create a router', done => {
		const model = { };
		const def = testDef;
		const mockClass = utils.makeMockControllerClass({ model, def }, TestController);
		const router = createRouter(mockClass, 'test');
		router.should.have.property('params');
		done();
	});

	it('should fail with missing controller', done => {
		const model = { };
		const def = testDef;
		try {
			const router = createRouter(null, 'test');
		} catch (err) {
			err.should.have.property('message').equal('Invalid Controller - missing Controller');
			done();
		}
	});

	it('should fail with invalid controller', done => {
		const model = { };
		const def = testDef;
		try {
			const router = createRouter('this is the wrong type', 'test');
		} catch (err) {
			err.should.have.property('message').equal('Invalid Controller - not function');
			done();
		}
	});

	it('should succeed even with invalid controller definitions', done => {
		const model = { };
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
						operationId: 'update',
					}
				},
				'/{one}/{two}': {
					get: {
						summary: 'Another Thing',
						operationId: 'update',
					}
				}
			}
		};
		class ParamController extends BaseController {
			constructor() { super(def); }
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
