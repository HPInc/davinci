const should = require('should');
const BaseController = require('../../src/BaseController');

describe('BaseController', () => {

	describe('#get', () => {

		it('should throw an error when no model was specified', async () => {
			const controller = new BaseController();

			try {
				await controller.getById({});
			} catch(err) {
				err.message.should.be.equal('No model implemented')
			}
		});

		it('should call model.get with the id', async () => {
			const controller = new BaseController();
			controller.model = { findOne: () => ({ _id: '123' }) };
			const context = { params: { id: 123 } };

			const result = await controller.getById(context);
			result.should.have.property('_id').equal('123');
		});
	});
});
