const _ = require('lodash');

class HttpError extends Error {
	/**
	 * Create an HttpError instance
	 *
	 * @constructor
	 * @param message {string} The error message
	 * @param name {string} The error name (ie, BadRequest)
	 * @param code {number} The HTTP status code
	 * @param className {string} The class name (ie, bad-request)
	 * @param data {*} response extra, could hold error codes or any relevant information
	 */
	constructor(message, name, code, className, data = {}) {
		super(message);
		this.name = name || 'Error';
		this.code = code;
		this.className = className;

		const clonedData = _.clone(data);
		this.data = clonedData;
		if (clonedData.errors) {
			this.errors = clonedData.errors;
			delete clonedData.errors;
		}
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			className: this.className,
			data: this.data,
			errors: this.errors,
			stack: this.stack
		};
	}
}

// 400 - Bad Request
class BadRequest extends HttpError {
	constructor(message, data) {
		super(message, 'BadRequest', 400, 'bad-request', data);
	}
}

// 401 - Not Authenticated
class NotAuthenticated extends HttpError {
	constructor(message, data) {
		super(message, 'NotAuthenticated', 401, 'not-authenticated', data);
	}
}

// 402 - Payment Error
class PaymentError extends HttpError {
	constructor(message, data) {
		super(message, 'PaymentError', 402, 'payment-error', data);
	}
}

// 403 - Forbidden
class Forbidden extends HttpError {
	constructor(message, data) {
		super(message, 'Forbidden', 403, 'forbidden', data);
	}
}

// 404 - Not Found
class NotFound extends HttpError {
	constructor(message, data) {
		super(message, 'NotFound', 404, 'not-found', data);
	}
}

// 405 - Method Not Allowed
class MethodNotAllowed extends HttpError {
	constructor(message, data) {
		super(message, 'MethodNotAllowed', 405, 'method-not-allowed', data);
	}
}

// 406 - Not Acceptable
class NotAcceptable extends HttpError {
	constructor(message, data) {
		super(message, 'NotAcceptable', 406, 'not-acceptable', data);
	}
}

// 408 - Timeout
class Timeout extends HttpError {
	constructor(message, data) {
		super(message, 'Timeout', 408, 'timeout', data);
	}
}

// 409 - Conflict
class Conflict extends HttpError {
	constructor(message, data) {
		super(message, 'Conflict', 409, 'conflict', data);
	}
}

// 411 - Length Required
class LengthRequired extends HttpError {
	constructor(message, data) {
		super(message, 'LengthRequired', 411, 'length-required', data);
	}
}

// 422 - Unprocessable
class Unprocessable extends HttpError {
	constructor(message, data) {
		super(message, 'Unprocessable', 422, 'unprocessable', data);
	}
}

// 429 - Too Many Requests
class TooManyRequests extends HttpError {
	constructor(message, data) {
		super(message, 'TooManyRequests', 429, 'too-many-requests', data);
	}
}

// 500 - General Error
class GeneralError extends HttpError {
	constructor(message, data) {
		super(message, 'GeneralError', 500, 'general-error', data);
	}
}

// 500 - Internal Server Error
class InternalServerError extends HttpError {
	constructor(message, data) {
		super(message, 'InternalServerError', 500, 'internal-server-error', data);
	}
}

// 501 - Not Implemented
class NotImplemented extends HttpError {
	constructor(message, data) {
		super(message, 'NotImplemented', 501, 'not-implemented', data);
	}
}

// 502 - Bad Gateway
class BadGateway extends HttpError {
	constructor(message, data) {
		super(message, 'BadGateway', 502, 'bad-gateway', data);
	}
}

// 503 - Unavailable
class Unavailable extends HttpError {
	constructor(message, data) {
		super(message, 'Unavailable', 503, 'unavailable', data);
	}
}

module.exports = {
	HttpError,
	BadRequest,
	NotAuthenticated,
	PaymentError,
	Forbidden,
	NotFound,
	MethodNotAllowed,
	NotAcceptable,
	Timeout,
	Conflict,
	LengthRequired,
	Unprocessable,
	TooManyRequests,
	GeneralError,
	InternalServerError,
	NotImplemented,
	BadGateway,
	Unavailable
};
