
module.exports = (req, res, next) => {

	const context = {
		body: req.body,
		contextId: req.contextId
	};

	next();
};
