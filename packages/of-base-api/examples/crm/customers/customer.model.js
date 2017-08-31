const mongooseModel = require('../../../src/mongoose.model');
const schema = require('./customer.schema');
const { lowerCase } = require('feathers-hooks-common');

const customerModel = mongooseModel('Customer', schema, 'customers');

customerModel.addHook('before', 'find', hook => {
	console.log(hook.params);
});

customerModel.addHook('after', 'find', hook => {
	console.log(hook.result);
});

customerModel.addHook('before', 'create', lowerCase('name'));

module.exports = customerModel;
