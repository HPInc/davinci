import should from 'should';
import mongoose from 'mongoose';
import Sinon from 'sinon';
import { mgoose } from '../../../../mongoose/src';

const { beforeRead, afterRead, beforeWrite, afterWrite, beforeDelete, afterDelete } = mgoose;

const sinon = Sinon.createSandbox();

describe('mongoose hooks', () => {
	let CustomerSchema;
	let CustomerModel;
	let callback;
	const context = { accountId: '123123' };

	beforeEach(async () => {
		delete mongoose.models['customer'];
		CustomerSchema = new mongoose.Schema();
		await mongoose.connect(process.env.MONGODB_URL);
		callback = sinon.stub();
	});

	afterEach(async () => {
		sinon.restore();
		await mongoose.connection.close();
	});

	/**
	 * beforeRead
	 */
	describe('beforeRead', () => {
		beforeEach(async () => {
			beforeRead(CustomerSchema, callback);
			CustomerModel = mongoose.model('customer', CustomerSchema);
		});

		it('should correctly trigger the hook when `find` method is called', async () => {
			await CustomerModel.find({}, null, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('find');
		});

		it('should correctly trigger the hook when `findOne` method is called', async () => {
			await CustomerModel.findOne({}, null, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('findOne');
		});

		it('should correctly trigger the hook when `findOneAndDelete` method is called', async () => {
			await CustomerModel.findOneAndDelete({});
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			// should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('findOneAndDelete');
		});

		it('should correctly trigger the hook when `findOneAndRemove` method is called', async () => {
			await CustomerModel.findOneAndRemove({});
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			// should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('findOneAndRemove');
		});

		it('should correctly trigger the hook when `findOneAndUpdate` method is called', async () => {
			// @ts-ignore
			await CustomerModel.findOneAndUpdate({}, {}, { context });
			// findOneAndUpdate method seem to trigger both `findOne` and `findOneAndUpdate` hooks
			should(callback.callCount).be.equal(2);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('findOneAndUpdate');
		});

		it('should correctly trigger the hook when `deleteMany` method is called', async () => {
			await CustomerModel.deleteMany({});
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			// should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('deleteMany');
		});

		it('should correctly trigger the hook when `update` method is called', async () => {
			await CustomerModel.update({}, null, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('update');
		});

		it('should correctly trigger the hook when `updateOne` method is called', async () => {
			await CustomerModel.updateOne({}, null, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('updateOne');
		});

		it('should correctly trigger the hook when `updateMany` method is called', async () => {
			await CustomerModel.updateMany({}, null, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('updateMany');
		});
	});

	/**
	 * afterRead
	 */
	describe('afterRead', () => {
		beforeEach(async () => {
			afterRead(CustomerSchema, (...args) => {
				callback(...args);
			});
			CustomerModel = mongoose.model('customer', CustomerSchema);
		});
		it('should correctly trigger the hook when `find` method is called', async () => {
			await CustomerModel.find({}, null, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('find');
		});

		it('should correctly trigger the hook when `findOne` method is called', async () => {
			await CustomerModel.findOne({}, null, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('findOne');
		});

		it('should correctly trigger the hook when `findOneAndDelete` method is called', async () => {
			await CustomerModel.findOneAndDelete({});
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			// should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('findOneAndDelete');
		});

		it('should correctly trigger the hook when `findOneAndRemove` method is called', async () => {
			await CustomerModel.findOneAndRemove({});
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			// should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('findOneAndRemove');
		});

		it('should correctly trigger the hook when `findOneAndUpdate` method is called', async () => {
			// @ts-ignore
			await CustomerModel.findOneAndUpdate({}, {}, { context });
			// findOneAndUpdate method seem to trigger both `findOne` and `findOneAndUpdate` hooks
			should(callback.callCount).be.equal(2);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('findOne');
		});

		it('should correctly trigger the hook when `deleteMany` method is called', async () => {
			await CustomerModel.deleteMany({});
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			// should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('deleteMany');
		});

		it('should correctly trigger the hook when `update` method is called', async () => {
			await CustomerModel.update({}, null, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('update');
		});

		it('should correctly trigger the hook when `updateOne` method is called', async () => {
			await CustomerModel.updateOne({}, null, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('updateOne');
		});

		it('should correctly trigger the hook when `updateMany` method is called', async () => {
			await CustomerModel.updateMany({}, null, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('updateMany');
		});
	});

	/**
	 * beforeWrite
	 */
	describe('beforeWrite', () => {
		beforeEach(async () => {
			beforeWrite(CustomerSchema, callback);
			CustomerModel = mongoose.model('customer', CustomerSchema);
		});

		it('should correctly trigger the hook when `findOneAndUpdate` method is called', async () => {
			await CustomerModel.findOneAndUpdate({}, null, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('findOneAndUpdate');
		});

		it('should correctly trigger the hook when `save` method is called', async () => {
			const customer = new CustomerModel();
			await customer.save({ context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Model);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('save');
		});

		it('should correctly trigger the hook when `update` method is called', async () => {
			await CustomerModel.update({}, {}, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			// should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('update');
		});

		it('should correctly trigger the hook when `updateMany` method is called', async () => {
			// @ts-ignore
			await CustomerModel.updateMany({}, {}, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('updateMany');
		});
	});

	/**
	 * afterWrite
	 */
	describe('afterWrite', () => {
		beforeEach(async () => {
			afterWrite(CustomerSchema, callback);
			CustomerModel = mongoose.model('customer', CustomerSchema);
		});

		it('should correctly trigger the hook when `findOneAndUpdate` method is called', async () => {
			await CustomerModel.findOneAndUpdate({}, null, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('findOneAndUpdate');
		});

		it('should correctly trigger the hook when `save` method is called', async () => {
			const customer = new CustomerModel();
			await customer.save({ context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Model);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('save');
		});

		it('should correctly trigger the hook when `update` method is called', async () => {
			await CustomerModel.update({}, {}, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			// should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('update');
		});

		it('should correctly trigger the hook when `updateMany` method is called', async () => {
			// @ts-ignore
			await CustomerModel.updateMany({}, {}, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('updateMany');
		});
	});

	/**
	 * beforeDelete
	 */
	describe('beforeDelete', () => {
		beforeEach(async () => {
			beforeDelete(CustomerSchema, callback);
			CustomerModel = mongoose.model('customer', CustomerSchema);
		});

		it('should correctly trigger the hook when `deleteMany` method is called', async () => {
			await CustomerModel.deleteMany({}, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('deleteMany');
		});

		it('should correctly trigger the hook when `findOneAndDelete` method is called', async () => {
			await CustomerModel.findOneAndDelete({}, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('findOneAndDelete');
		});

		it('should correctly trigger the hook when `findOneAndRemove` method is called', async () => {
			await CustomerModel.findOneAndRemove({}, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('findOneAndRemove');
		});
	});

	/**
	 * afterDelete
	 */
	describe('afterDelete', () => {
		beforeEach(async () => {
			afterDelete(CustomerSchema, callback);
			CustomerModel = mongoose.model('customer', CustomerSchema);
		});

		it('should correctly trigger the hook when `deleteMany` method is called', async () => {
			await CustomerModel.deleteMany({}, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.deepEqual(context);
			should(callback.getCall(0).args[2]).be.equal('deleteMany');
		});

		it('should correctly trigger the hook when `findOneAndDelete` method is called', async () => {
			await CustomerModel.findOneAndDelete({}, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('findOneAndDelete');
		});

		it('should correctly trigger the hook when `findOneAndRemove` method is called', async () => {
			await CustomerModel.findOneAndRemove({}, { context });
			should(callback.callCount).be.equal(1);
			should(callback.getCall(0).args[0]).be.instanceOf(mongoose.Query);
			should(callback.getCall(0).args[1]).be.equal(context);
			should(callback.getCall(0).args[2]).be.equal('findOneAndRemove');
		});
	});
});
