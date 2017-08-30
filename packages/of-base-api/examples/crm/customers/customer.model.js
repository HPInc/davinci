const mongoose = require('mongoose');
const service = require('feathers-mongoose');

mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;
const CustomerSchema = new Schema({
	text: {
		type: String,
		required: true
	}
});
const Model = mongoose.model('Customer', CustomerSchema);

module.exports = service({
	Model,
	lean: true, // set to false if you want Mongoose documents returned
	paginate: {
		default: 10,
		max: 100
	}
});
