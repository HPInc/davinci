const errors = require('./src/errors');
const BaseController = require('./src/BaseController');
const baseService = require('./src/baseService');
const { createApp } = require('./src/createApp');
const createRouter = require('./src/createRouter');
const MongooseModel = require('./src/MongooseModel');

/**
 * This is only here to assist people when upgrading their API.
 * It will be removed in a future version.
 */
const boot = () => {
	/* eslint-disable no-console */
	console.error('ERROR: boot() is deprecated, please use createApp() instead.');
	process.exit(-1);
};

module.exports = {
	BaseController,
	baseService,
	boot,
	createApp,
	createRouter,
	MongooseModel,
	errors
};
