const debug = require('debug')('of-base-api:example');
const BaseController = require('../../../src/BaseController');
const definition = require('./customer.def');
const CustomerModel = require('./customer.model');

class CustomerController extends BaseController {
	// easy to test
	constructor({ model = CustomerModel, def = definition } = {}) {
		super();
		this.model = model;
		this.def = def;
	}

	myStaticMethod(ignored, context) {
		return new Promise(resolve => {
			debug('static method on', this.name);
			debug('context', context);
			resolve({ results: 'my static method' });
		});
	}

	myMethod(context) {
		return new Promise(resolve => {
			debug('method on', this.name);
			debug('context', context);
			resolve({ results: 'my normal method' });
		});
	}

	async myMethod2() {
		debug('async method on', this.name);
		return { success: true };
	}
}

module.exports = CustomerController;
