const debug = require('debug')('of-base-api:example');
const mongooseModel = require('../../../src/mongooseModel');
const mongoose = require('mongoose');
const schema = require('./customer.schema');
const { lowerCase } = require('feathers-hooks-common');

const customerModel = mongooseModel('Customer', new mongoose.Schema(schema), 'customers');
// or
// const customerModel = mongooseModel('Customer', schema, 'customers');

customerModel.addHook('before', 'create', hook => {
	debug(hook.params);
});

customerModel.addHook('before', 'find', hook => {
	debug(hook.params);
});

customerModel.addHook('after', 'find', hook => {
	debug(hook.result);
});

customerModel.addHook('before', 'create', lowerCase('name'));
customerModel.addHook('before', 'update', [lowerCase('name'), hook => {
	debug(hook);
}]);

module.exports = customerModel;
