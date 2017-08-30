const _ = require('lodash');
const errors = require('../errors');

const middleware = (err, req, res, next) => {

	if (err.name === 'MongoError') {

		// mongo db error
		next(new errors.BadRequest(err.errmsg, err.code));

	} else if (err.name === 'ValidationError') {

		// mongoose validation error
		const validations = _.values(err.errors).map(val => {
			return { path: val.path, message: val.message };
		});
		next(new errors.ValidationFailed(err.message, validations));

	} else if (err.name === 'CastError') {

		next(new errors.BadRequest(err.message));

	} else {
		next(err);
	}
};

module.exports = middleware;
