/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

// import { expect } from '../support/chai';
import { httpErrors } from '../../src';
import { expect } from '../support/chai';

describe('httpErrors', () => {
	it('should initialize using the generic HttpError class', () => {
		const httpError = new httpErrors.HttpError('item not found', 'ItemNotFound', 404, 'item-not-found', {
			itemId: 1
		});

		expect(httpError.toJSON()).to.containSubset({
			name: 'ItemNotFound',
			message: 'item not found',
			statusCode: 404,
			className: 'item-not-found',
			data: { itemId: 1 }
		});
	});

	it('should initialize errors with the correct fields', () => {
		const errorsToTest = [
			{ name: 'BadRequest', statusCode: 400 },
			{ name: 'NotAuthenticated', statusCode: 401 },
			{ name: 'PaymentError', statusCode: 402 },
			{ name: 'Forbidden', statusCode: 403 },
			{ name: 'NotFound', statusCode: 404 },
			{ name: 'MethodNotAllowed', statusCode: 405 },
			{ name: 'NotAcceptable', statusCode: 406 },
			{ name: 'Timeout', statusCode: 408 },
			{ name: 'Conflict', statusCode: 409 },
			{ name: 'LengthRequired', statusCode: 411 },
			{ name: 'Unprocessable', statusCode: 422 },
			{ name: 'TooManyRequests', statusCode: 429 },
			{ name: 'GeneralError', statusCode: 500 },
			{ name: 'InternalServerError', statusCode: 500 },
			{ name: 'NotImplemented', statusCode: 501 },
			{ name: 'BadGateway', statusCode: 502 },
			{ name: 'Unavailable', statusCode: 503 }
		];
		errorsToTest.forEach(({ name, statusCode }) => {
			const ErrorClass = httpErrors[name];
			const error = new ErrorClass(`${name} error occurred`, { name, statusCode });

			expect(error.toJSON()).to.containSubset({
				name,
				message: `${name} error occurred`,
				statusCode,
				data: { name, statusCode }
			});
		});
	});
});
