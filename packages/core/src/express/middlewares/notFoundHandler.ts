import * as errors from '../../errors/httpErrors';

export default () => {
	// @ts-ignore-next-line
	return (req, res, next) => {
		const { url } = req;
		next(new errors.NotFound('Page not found', { url }));
	};
};
