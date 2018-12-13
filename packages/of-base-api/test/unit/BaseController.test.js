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

	describe('#update', () => {

		it('should throw a NotFound error when the resource wasn\'t found', async () => {
			// Feathers service 'patch' returns an array of updated records, but our controller
			// should just return a 404 if the service returned an empty array (ie, no updates)
			const controller = new BaseController();
			controller.model = { patch: () => ([]) };
			const context = {};

			try {
				await controller.update({ id: 'MISSING', data: { foo: 'bar' } }, context);
				throw new Error('should not get here');
			} catch(err) {
				err.name.should.be.equal('NotFound');
			}
		});

		it('should return the resource after updating', async () => {
			// Feathers service 'patch' returns an array of updated records, but our controller
			// should just return the single record with a matching ID that we asked to update.
			const controller = new BaseController();
			controller.model = { patch: () => ([{ _id: '1234', foo: 'bar' }]) };
			const context = {};

			const result = await controller.update({ id: 'MISSING', data: { foo: 'bar' } }, context);

			result.should.eql({ _id: '1234', foo: 'bar' });
		});
	});

	describe('#remove', () => {

		it('should throw a NotFound error when the resource wasn\'t found', async () => {
			// Feathers service 'remove' returns an array of removed records, but our controller
			// should just return a 404 if the service returned an empty array (ie, no deletes)
			const controller = new BaseController();
			controller.model = { remove: () => ([]) };
			const context = {};

			try {
				await controller.remove({ id: 'MISSING' }, context);
				throw new Error('should not get here');
			} catch(err) {
				err.name.should.be.equal('NotFound');
			}
		});

		it('should return the resource after deleting', async () => {
			// Feathers service 'remove' returns an array of removed records, but our controller
			// should just return the single record with a matching ID that we asked to delete.
			const controller = new BaseController();
			controller.model = { remove: () => ([{ _id: '1234', foo: 'bar' }]) };
			const context = {};

			const result = await controller.remove({ id: '1234' }, context);

			result.should.eql({ _id: '1234', foo: 'bar' });
		});
	});
});
