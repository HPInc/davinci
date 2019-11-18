import Debug from 'debug';
import * as errors from '../../errors/httpErrors';

const debug = new Debug('davinci:error-handler');

export default ({ exposeStack = false } = {}) => {
	// @ts-ignore-next-line
	return (err, req, res, next) => {
		debug(err);

		let error = err;

		// include support for Feathers errors, coming from feathers-mongoose/etc
		if (err.type === 'FeathersError') {
			error = new errors.HttpError(err.message, err.name, err.code, err.className, err.data);
			error.errors = err.errors;
			error.stack = err.stack;
		} else if (!(err instanceof errors.HttpError)) {
			error = new errors.InternalServerError(err.message, {
				errors: err.errors
			});

			if (err.stack) {
				error.stack = err.stack;
			}
		}

		error.code = !Number.isNaN(parseInt(error.code, 10)) ? parseInt(error.code, 10) : 500;

		const output = { ...error.toJSON()};

		// Don't show stack trace if it is a 404 error
		if (!exposeStack || error.code === 404) {
			delete output.stack;
		}

		console.error(error);
		res.status(error.code);
		res.set('Content-Type', 'application/json');
		res.json(output);
	};
};
