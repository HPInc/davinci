export default () => (req, res, next) => {
	const requestHandled = req.requestHandled;
	const result = req.result;
	const statusCode = req.statusCode;

	if (!requestHandled) return next();

	if (typeof result === 'undefined') {
		res.status(statusCode || 204).end();
	} else {
		res.status(statusCode || 200).send(result);
	}
};
