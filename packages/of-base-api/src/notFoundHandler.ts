import * as errors from './errors';

export default () => {
	return (req, _res, next) => {
		const { url } = req;
		next(new errors.NotFound('Page not found', { url }));
	};
};
