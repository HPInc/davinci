class InvalidIdError extends Error {
	constructor(message, errorCode) {
		super();

		Error.captureStackTrace(this, InvalidIdError);

		this.name = this.constructor.name;
		this.message = message || 'The requested ID was invalid';
		this.statusCode = 400;
		this.errorCode = errorCode || 400;
	}
}

module.exports = InvalidIdError;
