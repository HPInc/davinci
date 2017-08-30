const mongoose = require('mongoose');
const service = require('feathers-mongoose');

const Schema = mongoose.Schema;
const FileSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	contextId: {
		type: String,
		required: true
	}
});
const Model = mongoose.model('File', FileSchema, 'files');

module.exports = service({
	Model,
	lean: true, // set to false if you want Mongoose documents returned
	paginate: {
		default: 10,
		max: 100
	}
});
