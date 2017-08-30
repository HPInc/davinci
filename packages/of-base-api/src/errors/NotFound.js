class NotFoundError extends Error {
	constructor(message, errorCode) {
		super();

		Error.captureStackTrace(this, NotFoundError);

		this.name = this.constructor.name;
		this.message = message || 'The requested resource couldn\'t be found';
		this.statusCode = 400;
		this.errorCode = errorCode || 400;
	}
}

module.exports = NotFoundError;
