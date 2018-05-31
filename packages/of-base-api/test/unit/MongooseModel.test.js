const MongooseModel = require('../../src/MongooseModel');

describe('MongooseModel', () => {
	it('should successfully create a MongooseModel', () => {
		const schema = { name: { type: String } };
		const model = new MongooseModel('Test', schema, 'tests');
		model.Model.should.have.property('modelName').equal('Test');
	});
});
