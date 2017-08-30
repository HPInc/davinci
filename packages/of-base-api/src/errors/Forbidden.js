class ForbiddenError extends Error {
	constructor(message, errorCode) {
		super();

		Error.captureStackTrace(this, ForbiddenError);

		this.name = this.constructor.name;
		this.message = message || 'ForbiddenError';
		this.statusCode = 400;
		this.errorCode = errorCode || 400;
	}
}

module.exports = ForbiddenError;
