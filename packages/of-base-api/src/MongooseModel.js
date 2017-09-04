const mongoose = require('mongoose');
const service = require('feathers-mongoose');
const { applyHook } = require('./hookUtils');

class MongooseModel {
	constructor(name, schema, collection) {
		this.Schema = schema instanceof mongoose.Schema ? schema : new mongoose.Schema(schema);
		this.Model = mongoose.model(name, this.Schema, collection);

		const featherService = service({
			Model: this.Model,
			lean: true, // set to false if you want Mongoose documents returned
			paginate: false
		});

		return applyHook(featherService);
	}
}

module.exports = MongooseModel;
