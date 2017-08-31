const BaseController = require('./src/BaseController');
const boot = require('./src/boot');
const createRouter = require('./src/createRouter');
const mongooseModel = require('./src/mongooseModel');
const errors = require('feathers-errors');

module.exports = {
	BaseController,
	boot,
	createRouter,
	mongooseModel,
	errors
};
