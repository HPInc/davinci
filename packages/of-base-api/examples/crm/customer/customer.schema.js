const { Mixed } = require('mongoose').Schema.Types;
// TODO - we need a better example than this
module.exports = {
	firstname: {
		type: String,
		required: true
	},
	lastname: {
		type: String,
		required: true
	},
	weight: {
		type: Mixed
	}
};
