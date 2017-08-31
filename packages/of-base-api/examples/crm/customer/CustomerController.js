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

	static myStaticMethod(context) {
		return new Promise(resolve => {
			console.log('static method on', this.name);
			console.log('context', context);
			resolve({ results: 'my static method' });
		});
	}

	myMethod(context) {
		return new Promise(resolve => {
			console.log('method on', this.name);
			console.log('context', context);
			resolve({ results: 'my normal method' });
		});
	}

	async myMethod2(context) {
		return { success: true };
	}
}

module.exports = CustomerController;
