const mongoose = require('mongoose');
const service = require('feathers-mongoose');
const { applyHook } = require('./lib/HookUtils');

// TODO the mongoose.model library could be a separate npm module
const mongooseModel = (name, schema, collection) => {
	const Schema = new mongoose.Schema(schema);
	const Model = mongoose.model(name, Schema, collection);

	// TODO these settings could be provided somewhere when first loading the mongoose-model library
	const featherService = service({
		Model,
		lean: true, // set to false if you want Mongoose documents returned
		paginate: {
			default: 10,
			max: 100
		}
	});

	return applyHook(featherService);
};

module.exports = mongooseModel;
