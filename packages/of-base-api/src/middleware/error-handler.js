const errorHandler = () => (err, req, res, next) => {
	if ((err && !err.statusCode) || err.statusCode === 500) {
		console.log('500 Server Error');
		console.log(err.stack);
	}
	res.status(err.statusCode || 500).send({
		error: err
	});
};

module.exports = errorHandler;
