import should from 'should';
import BaseController from '../../src/BaseController';
import Sinon from 'sinon';

const sinon = Sinon.createSandbox();

describe('BaseController', () => {
	beforeEach(() => {
		sinon.restore();
	});
	describe('#get', () => {
		it('should throw an error when no model was specified', async () => {
			const controller = new BaseController();

			try {
				await controller.findById(null, null, null);
			} catch (err) {
				err.message.should.be.equal('No model implemented');
			}
		});

		it('should call model.get with the id', async () => {
			const model = { findOne: () => ({ _id: '123' }) };
			const controller = new BaseController(model);

			const result = await controller.findById('123', null, null);
			result.should.have.property('_id').equal('123');
		});
	});

	describe('#update', () => {
		it("should throw a NotFound error when the resource wasn't found", async () => {
			// Feathers service 'patch' returns an array of updated records, but our controller
			// should just return a 404 if the service returned an empty array (ie, no updates)
			const model = { findOneAndUpdate: sinon.stub() };
			const controller = new BaseController(model);
			const context = {};

			try {
				await controller.updateById('MISSING', { foo: 'bar' }, context);
				throw new Error('should not get here');
			} catch (err) {
				err.name.should.be.equal('NotFound');
				should(model.findOneAndUpdate.calledOnce).be.True();
			}
		});

		it('should return the resource after updating', async () => {
			// Feathers service 'patch' returns an array of updated records, but our controller
			// should just return the single record with a matching ID that we asked to update.
			const model = { findOneAndUpdate: sinon.stub().resolves({ _id: '1234', foo: 'bar' }) };
			const controller = new BaseController(model);
			const context = {};

			const result = await controller.updateById('MISSING', { foo: 'bar' }, context);

			result.should.eql({ _id: '1234', foo: 'bar' });
			should(model.findOneAndUpdate.calledOnce).be.True();
		});
	});

	describe('#remove', () => {
		it("should throw a NotFound error when the resource wasn't found", async () => {
			// Feathers service 'remove' returns an array of removed records, but our controller
			// should just return a 404 if the service returned an empty array (ie, no deletes)
			const model = { findOneAndDelete: sinon.stub() };
			const controller = new BaseController(model);
			const context = {};

			try {
				await controller.deleteById('MISSING', context);
				throw new Error('should not get here');
			} catch (err) {
				err.name.should.be.equal('NotFound');
				should(model.findOneAndDelete.calledOnce).be.True();
			}
		});

		it('should return the resource after deleting', async () => {
			// Feathers service 'remove' returns an array of removed records, but our controller
			// should just return the single record with a matching ID that we asked to delete.
			const model = { findOneAndDelete: sinon.stub().resolves({ _id: '1234', foo: 'bar' }) };
			const controller = new BaseController(model);

			const result = await controller.deleteById('1234', context);

			result.should.eql({ _id: '1234', foo: 'bar' });
			should(model.findOneAndDelete.calledOnce).be.True();
		});
	});
});
