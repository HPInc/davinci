import should from 'should';
import responseHandler from '../../../../src/express/middlewares/responseHandler';

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
	send(send) {
		this.send = send;
		return this;
	}
}

class ReqMock {
	requestHandled: boolean;
	result: any;
	statusCode: number;
}

describe('responseHandler', () => {
	it('should handle a result correctly', async () => {
		const handler = responseHandler();
		const res = new ResMock();
		const req = new ReqMock();
		req.requestHandled = true;
		req.statusCode = 222;
		req.result = { mySuccess: true };

		handler(req, res, () => {});

		should(res.send).match({ mySuccess: true });
		should(res.code).eql(222);
	});
});
