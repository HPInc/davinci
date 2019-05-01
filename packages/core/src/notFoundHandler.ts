import { errors } from '@of-base-api/common';

export default () => {
	// @ts-ignore
	return (req, res, next) => {
		const { url } = req;
		next(new errors.NotFound('Page not found', { url }));
	};
};
