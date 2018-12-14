const debug = require('debug')('of-base-api:example');
const MongooseModel = require('../../../src/MongooseModel');
const mongoose = require('mongoose');
const schema = require('./customer.schema');
const { lowerCase } = require('feathers-hooks-common');

const create = () => {

	const customerSchema = new mongoose.Schema(schema);
	const customerModel = new MongooseModel('Customer', customerSchema, 'customers');

	customerModel.before('all', hook => {
		debug(hook.params);
	});

	customerModel.before('find', hook => {
		debug(hook.params);
	});

	customerModel.before('findOne', hook => {
		debug(hook.params);
	});

	customerModel.after('find', hook => {
		debug(hook.params);
	});

	customerModel.addHook('before', 'findOne', hook => {
		debug(hook.params);
	});

	customerModel.addHook('after', 'find', hook => {
		debug(hook.result);
	});

	customerModel.addHook('before', 'create', lowerCase('name'));
	customerModel.addHook('before', 'update', [lowerCase('name'), hook => {
		debug(hook);
	}]);

	return customerModel;
};

module.exports = { create };
