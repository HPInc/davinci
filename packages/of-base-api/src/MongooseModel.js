const mongoose = require('mongoose');
const service = require('feathers-mongoose');
const { applyHook } = require('./hookUtils');

class MongooseModel {
	constructor(name, schema, collection, options = {}) {
		this.Schema = schema.constructor.name === 'Schema' ? schema : new mongoose.Schema(schema);

		// ensure that models aren't created more than once, this helps with unit testing
		if (!mongoose.models[name]) {
			this.Model = mongoose.model(name, this.Schema, collection);
		}	else {
			this.Model = mongoose.model(name);
		}

		const featherService = service({
			Model: this.Model,
			paginate: false,
			lean: true, // set to false if you want Mongoose documents returned
			...options
		});

		return applyHook(featherService);
	}
}

module.exports = MongooseModel;
