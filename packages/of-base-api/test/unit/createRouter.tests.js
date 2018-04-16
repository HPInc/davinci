const { coerceType } = require('../../src/createRouter');

describe('createRouter', () => {
	describe('#coerceType', () => {
		it('Should correctly coerce types', async () => {
			coerceType('{ "test": 1 }', { type: 'object' }).should.be.Object().and.have.property('test').equal(1);
			coerceType('[{ "test": 1 }]', { type: 'array' }).should.be.Array().and.have.property(0).deepEqual({ "test": 1 });
			coerceType('2', { type: 'number' }).should.be.Number().and.equal(2);
			coerceType('2', { type: 'string' }).should.be.String().and.equal('2');
		});
	})
});

