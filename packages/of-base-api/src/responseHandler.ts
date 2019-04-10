export default () => {
	return (req, res) => {
		const result = req.result;
		const statusCode = req.statusCode;

		if (typeof result === 'undefined') {
			res.status(statusCode || 204).end();
		} else {
			res.status(statusCode || 200).json(result);
		}
	};
};
