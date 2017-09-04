const BaseController = require('./src/BaseController');
const baseService = require('./src/baseService');
const boot = require('./src/boot');
const createRouter = require('./src/createRouter');
const MongooseModel = require('./src/MongooseModel');
const errors = require('feathers-errors');

module.exports = {
	BaseController,
	baseService,
	boot,
	createRouter,
	MongooseModel,
	errors
};
