/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

// eslint-disable-next-line max-classes-per-file

interface ErrorData {
	errors?: Array<unknown>;
	[key: string]: unknown;
}

export class HttpError extends Error {
	// https://github.com/Microsoft/TypeScript/issues/13965
	// tslint:disable-next-line variable-name
	__proto__: Error;

	statusCode: number;

	className?: string;

	data: unknown;

	errors?: unknown[];

	_type = 'davinciHttpError';

	/**
	 * Create an HttpError instance
	 *
	 * @constructor
	 * @param message {string} The error message
	 * @param name {string} The error name (ie, BadRequest)
	 * @param statusCode {number} The HTTP status code
	 * @param className {string} The class name (ie, bad-request)
	 * @param data {*} response extra, could hold error codes or any relevant information
	 */
	constructor(message: string, name: string, statusCode: number, className?: string, data?: ErrorData) {
		const trueProto = new.target.prototype;
		super(message);
		// eslint-disable-next-line no-proto
		this.__proto__ = trueProto;

		this.name = name || 'Error';
		this.statusCode = statusCode;
		this.className = className;

		const { errors, ...rest } = data ?? {};
		this.data = rest;
		this.errors = errors;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this);
		} else {
			this.stack = new Error().stack;
		}
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			statusCode: this.statusCode,
			className: this.className,
			data: this.data,
			errors: this.errors,
			stack: this.stack
		};
	}
}

// 400 - Bad Request
export class BadRequest extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'BadRequest', 'BadRequest', 400, 'bad-request', data);
	}
}

// 401 - Not Authenticated
export class NotAuthenticated extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'NotAuthenticated', 'NotAuthenticated', 401, 'not-authenticated', data);
	}
}

// 402 - Payment Error
export class PaymentError extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'PaymentError', 'PaymentError', 402, 'payment-error', data);
	}
}

// 403 - Forbidden
export class Forbidden extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'Forbidden', 'Forbidden', 403, 'forbidden', data);
	}
}

// 404 - Not Found
export class NotFound extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'NotFound', 'NotFound', 404, 'not-found', data);
	}
}

// 405 - Method Not Allowed
export class MethodNotAllowed extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'MethodNotAllowed', 'MethodNotAllowed', 405, 'method-not-allowed', data);
	}
}

// 406 - Not Acceptable
export class NotAcceptable extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'NotAcceptable', 'NotAcceptable', 406, 'not-acceptable', data);
	}
}

// 408 - Timeout
export class Timeout extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'Timeout', 'Timeout', 408, 'timeout', data);
	}
}

// 409 - Conflict
export class Conflict extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'Conflict', 'Conflict', 409, 'conflict', data);
	}
}

// 411 - Length Required
export class LengthRequired extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'LengthRequired', 'LengthRequired', 411, 'length-required', data);
	}
}

// 422 - Unprocessable
export class Unprocessable extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'Unprocessable', 'Unprocessable', 422, 'unprocessable', data);
	}
}

// 429 - Too Many Requests
export class TooManyRequests extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'TooManyRequests', 'TooManyRequests', 429, 'too-many-requests', data);
	}
}

// 500 - General Error
export class GeneralError extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'GeneralError', 'GeneralError', 500, 'general-error', data);
	}
}

// 500 - Internal Server Error
export class InternalServerError extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'InternalServerError', 'InternalServerError', 500, 'internal-server-error', data);
	}
}

// 501 - Not Implemented
export class NotImplemented extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'NotImplemented', 'NotImplemented', 501, 'not-implemented', data);
	}
}

// 502 - Bad Gateway
export class BadGateway extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'BadGateway', 'BadGateway', 502, 'bad-gateway', data);
	}
}

// 503 - Unavailable
export class Unavailable extends HttpError {
	constructor(message?: string, data?: ErrorData) {
		super(message ?? 'Unavailable', 'Unavailable', 503, 'unavailable', data);
	}
}
