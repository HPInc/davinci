import * as errors from '../../src/errors';

describe('errors', () => {
	describe('constructor', () => {
		it('contains our message', () => {
			const error = new errors.BadRequest('Invalid Password');

			should(error.code).equal(400);
			should(error.message).equal('Invalid Password');
		});

		it('allows arrays as data', () => {
			const data = [
				{
					hello: 'world'
				}
			];

			const error = new errors.GeneralError('Custom Error', data);

			error.data.should.be.an.Array();
			error.data.should.eql([{ hello: 'world' }]);
		});

		it('supports custom data', () => {
			const data = {
				email: 'Email Taken',
				password: 'Invalid Password'
			};

			const error = new errors.GeneralError('Custom Error', data);

			should(error.code).equal(500);
			should(error.message).equal('Custom Error');
			error.data.should.eql(data);
		});

		it('supports custom data with multiple errors', () => {
			const data = {
				errors: {
					email: 'Email Taken',
					password: 'Invalid Password'
				},
				foo: 'bar'
			};

			const error = new errors.BadRequest('Oh no', data);

			should(error.code).equal(400);
			should(error.message).equal('Oh no');
			should(error.errors).eql({ email: 'Email Taken', password: 'Invalid Password' });
			error.data.should.eql({ foo: 'bar' });
		});
	});

	describe('inheritance', () => {
		it('instanceof differentiates between error types', () => {
			const error = new errors.MethodNotAllowed();
			should(error instanceof errors.BadRequest).not.be.true();
		});

		it('follows the prototypical inheritance chain', () => {
			const error = new errors.MethodNotAllowed();
			should(error instanceof Error).be.true();
			should(error instanceof errors.HttpError).be.true();
		});

		it('has the correct constructors', () => {
			const error = new errors.NotFound();
			should(error.constructor === errors.NotFound).be.true();
			should(error.constructor.name === 'NotFound').be.true();
		});
	});

	describe('toJSON', () => {
		it('can return JSON', () => {
			const data = {
				errors: {
					email: 'Email Taken',
					password: 'Invalid Password'
				},
				foo: 'bar'
			};
			const error = new errors.GeneralError('Custom Error', data);

			const json = error.toJSON();

			should(json).match({
				name: 'GeneralError',
				message: 'Custom Error',
				code: 500,
				className: 'general-error',
				data: { foo: 'bar' },
				errors: { email: 'Email Taken', password: 'Invalid Password' }
			});
		});
	});

	describe('Errors', () => {
		const payload = { hello: 'world' };

		const expectedCodes = {
			BadRequest: 400,
			NotAuthenticated: 401,
			PaymentError: 402,
			Forbidden: 403,
			NotFound: 404,
			MethodNotAllowed: 405,
			NotAcceptable: 406,
			Timeout: 408,
			Conflict: 409,
			LengthRequired: 411,
			Unprocessable: 422,
			TooManyRequests: 429,
			GeneralError: 500,
			InternalServerError: 500,
			NotImplemented: 501,
			BadGateway: 502,
			Unavailable: 503
		};

		Object.keys(errors).forEach(errorName => {
			if (errorName === 'HttpError') return;

			it(errorName, async () => {
				const ErrorClass = errors[errorName];
				const err = new ErrorClass('my message', payload);
				const json = err.toJSON();

				json.should.match({
					name: errorName,
					message: 'my message',
					code: expectedCodes[errorName],
					data: payload
				});
			});
		});
	});
});
