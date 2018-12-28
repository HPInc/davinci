const errors = require('./errors');

module.exports = () => {
	return (req, res, next) => {
		const { url } = req;
		next(new errors.NotFound('Page not found', { url }));
	};
};
