const errors = require('../errors');

const middleware = (req, res, next) => {
	next(new errors.NotFound());
};

module.exports = middleware;
