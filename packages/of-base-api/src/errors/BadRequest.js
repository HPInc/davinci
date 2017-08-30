class BadRequestError extends Error {
	constructor(message, errorCode) {
		super();

		Error.captureStackTrace(this, BadRequestError);

		this.name = this.constructor.name;
		this.message = message || 'The requested ID was invalid';
		this.statusCode = 400;
		this.errorCode = errorCode || 400;
	}
}

module.exports = BadRequestError;
