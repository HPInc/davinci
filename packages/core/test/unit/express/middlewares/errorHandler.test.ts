import should from 'should';
import * as errors from '../../../../src/errors/httpErrors';
import errorHandler from '../../../../src/express/middlewares/errorHandler';

class ResMock {
	headers: object;
	code: number;
	constructor() {
		this.headers = {};
	}
	status(code) {
		this.code = code;
		return this;
	}
	set(header, value) {
		this.headers[header] = value;
		return this;
	}
	json(json) {
		this.json = json;
		return this;
	}
}

describe('errorHandler', () => {
	it('should handle of-base-api errors correctly', async () => {
		const handler = errorHandler();
		const routeError = new errors.BadRequest('explosions');
		const res = new ResMock();

		handler(routeError, null, res, () => {});

		should(res.json).match({ code: 400, name: 'BadRequest', message: 'explosions' });
		should(res.json).not.have.property('stack');
		should(res.code).eql(400);
	});

	it('should handle other errors correctly', async () => {
		const handler = errorHandler();
		const routeError = new Error('oh no');
		const res = new ResMock();

		handler(routeError, null, res, () => {});

		should(res.json).match({ code: 500, name: 'InternalServerError', message: 'oh no' });
		should(res.json).not.have.property('stack');
		should(res.code).eql(500);
	});

	it('should include stack trace when configured', async () => {
		const handler = errorHandler({ exposeStack: true });
		const routeError = new Error('oh no');
		const res = new ResMock();

		handler(routeError, null, res, () => {});

		should(res.json).match({ code: 500, name: 'InternalServerError', message: 'oh no' });
		should(res.json).have.property('stack');
		// @ts-ignore
		res.json.stack.should.startWith('Error: oh no\n');
	});

	it("shouldn't include stack trace for a 404 error", async () => {
		const handler = errorHandler({ exposeStack: true });
		const routeError = new errors.NotFound('nope');
		const res = new ResMock();

		handler(routeError, null, res, () => {});

		should(res.json).match({ code: 404, name: 'NotFound', message: 'nope' });
		should(res.json).not.have.property('stack');
	});
});
