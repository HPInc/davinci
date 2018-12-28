const feathersErrors = require('feathers-errors');
const errors = require('../../src/errors');
const errorHandler = require('../../src/errorHandler');

class ResMock {
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

        handler(routeError, null, res);

        res.json.should.match({ code: 400, name: 'BadRequest', message: 'explosions' });
        res.json.should.not.have.property('stack');
        res.code.should.eql(400);
    });

    it('should handle other errors correctly', async () => {
        const handler = errorHandler();
        const routeError = new Error('oh no');
        const res = new ResMock();

        handler(routeError, null, res);

        res.json.should.match({ code: 500, name: 'InternalServerError', message: 'oh no' });
        res.json.should.not.have.property('stack');
        res.code.should.eql(500);
    });

    it('should include stack trace when configured', async () => {
        const handler = errorHandler({ exposeStack: true });
        const routeError = new Error('oh no');
        const res = new ResMock();

        handler(routeError, null, res);

        res.json.should.match({ code: 500, name: 'InternalServerError', message: 'oh no' });
        res.json.should.have.property('stack');
        res.json.stack.should.startWith('Error: oh no\n');
    });

    it('shouldn\'t include stack trace for a 404 error', async () => {
        const handler = errorHandler({ exposeStack: true });
        const routeError = new errors.NotFound('nope');
        const res = new ResMock();

        handler(routeError, null, res);

        res.json.should.match({ code: 404, name: 'NotFound', message: 'nope' });
        res.json.should.not.have.property('stack');
	});

    it('should support feathers-mongoose errors', async () => {
        const handler = errorHandler({ exposeStack: true });
        const routeError = new feathersErrors.BadRequest('feathers!', { errors: { foo: 'bar' } });
        const res = new ResMock();

        handler(routeError, null, res);

        res.json.should.match({ code: 400, name: 'BadRequest', message: 'feathers!', errors: { foo: 'bar' } });
    });
});

