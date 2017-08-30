const API = require('../../../src/API');
const def = require('./customer.def');
const Customer = require('./customer.model');

class CustomerAPI extends API {
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

const controller = new CustomerAPI('customer', def);

controller.model = Customer;

module.exports = controller;
