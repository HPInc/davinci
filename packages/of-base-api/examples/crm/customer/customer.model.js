const debug = require('debug')('of-base-api:example');
const mongooseModel = require('../../../src/mongooseModel');
const schema = require('./customer.schema');
const { lowerCase } = require('feathers-hooks-common');

const customerModel = mongooseModel('Customer', schema, 'customers');

customerModel.addHook('before', 'find', hook => {
	debug(hook.params);
});

customerModel.addHook('after', 'find', hook => {
	debug(hook.result);
});

customerModel.addHook('before', 'create', lowerCase('name'));

module.exports = customerModel;
