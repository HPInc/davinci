const debug = require('debug')('of-base-api');
const errors = require('./errors');

module.exports = ({ exposeStack = false } = {}) => {
	return (routeError, req, res) => {
		debug(routeError);

		let error = routeError;

		// include support for Feathers errors, coming from feathers-mongoose/etc
		if (routeError.type === 'FeathersError') {
			const { message, name, code, className, data } = routeError;
			error = new errors.HttpError(message, name, code, className, data);
			error.errors = routeError.errors;
			error.stack = routeError.stack;
		} else if (!(routeError instanceof errors.HttpError)) {
			error = new errors.InternalServerError(routeError.message, {
				errors: routeError.errors
			});

			if (routeError.stack) {
				error.stack = routeError.stack;
			}
		}

		error.code = !isNaN(parseInt(error.code, 10)) ? parseInt(error.code, 10) : 500;

		const output = Object.assign({}, error.toJSON());

		// Don't show stack trace if it is a 404 error
		if (!exposeStack || error.code === 404) {
			delete output.stack;
		}

		res.status(error.code);
		res.set('Content-Type', 'application/json');
		res.json(output);
	};
};
