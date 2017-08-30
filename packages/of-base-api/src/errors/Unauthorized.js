class UnauthorizedError extends Error {
	constructor(message, errorCode) {
		super();

		Error.captureStackTrace(this, UnauthorizedError);

		this.name = this.constructor.name;
		this.message = message || 'Unauthorized Request';
		this.statusCode = 400;
		this.errorCode = errorCode || 400;
	}
}

module.exports = UnauthorizedError;
