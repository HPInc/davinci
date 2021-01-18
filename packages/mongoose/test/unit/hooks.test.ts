import should from 'should';
import mongoose from 'mongoose';
import Sinon from 'sinon';
import { mgoose } from '../../src';

const { beforeRead, afterRead, beforeWrite, afterWrite, beforeDelete, afterDelete } = mgoose;

const sinon = Sinon.createSandbox();

describe('mongoose hooks', () => {
	let CustomerSchema;
	let CustomerModel;
	let beforeReadCallback;
	let afterReadCallback;
	let beforeWriteCallback;
	let afterWriteCallback;
	let beforeDeleteCallback;
	let afterDeleteCallback;
	const context = { accountId: '123123' };
	const customersData = [{ firstname: 'Mike' }, { firstname: 'John' }];

	beforeEach(async () => {
		mongoose.modelNames().forEach(modelName => mongoose.deleteModel(modelName));

		CustomerSchema = new mongoose.Schema({ firstname: String });
		await mongoose.connect(process.env.MONGODB_URL);

		beforeReadCallback = sinon.stub();
		afterReadCallback = sinon.stub();
		beforeWriteCallback = sinon.stub();
		afterWriteCallback = sinon.stub();
		beforeDeleteCallback = sinon.stub();
		afterDeleteCallback = sinon.stub();
	});

	afterEach(async () => {
		sinon.restore();
		await mongoose.connection.close();
	});
	const registerReadHooks = ({ read, write, delete: del }: { read?: boolean; write?: boolean; delete?: boolean }) => {
		beforeEach(async () => {
			if (read) {
				beforeRead(CustomerSchema, ({ }) => { })
				beforeRead(CustomerSchema, beforeReadCallback);
				afterRead(CustomerSchema, afterReadCallback);
			}
			if (write) {
				beforeWrite(CustomerSchema, beforeWriteCallback);
				afterWrite(CustomerSchema, afterWriteCallback);
			}
			if (del) {
				beforeDelete(CustomerSchema, beforeDeleteCallback);
				afterDelete(CustomerSchema, afterDeleteCallback);
			}
			CustomerSchema.pre('updateOne', function (...args) {
				console.log(...args);
			});
			CustomerModel = mongoose.model('customer', CustomerSchema);
			await CustomerModel.deleteMany({}, { skipHooks: true });
			await CustomerModel.insertMany(customersData, { skipHooks: true });
		});

		afterEach(async () => {
			await CustomerModel.deleteMany();
		});
	};

	describe('countDocuments', () => {
		registerReadHooks({ read: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.find({}, null, { context }).countDocuments();
			const beforeArgs = beforeReadCallback.getCall(0).args[0];
			const afterArgs = afterReadCallback.getCall(0).args[0];

			should(beforeReadCallback.callCount).be.equal(1);
			should(beforeArgs).match({ hookName: 'countDocuments', context });
			should(beforeArgs)
				.have.property('query');

			should(afterReadCallback.callCount).be.equal(1);
			should(afterArgs).match({ hookName: 'countDocuments', count: 2, context });
			should(afterArgs)
				.have.property('query');
		});
	});

	describe('find', () => {
		registerReadHooks({ read: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.find({}, null, { context });
			const beforeArgs = beforeReadCallback.getCall(0).args[0];
			const afterArgs = afterReadCallback.getCall(0).args[0];

			should(beforeReadCallback.callCount).be.equal(1);
			should(beforeArgs).match({ hookName: 'find', context });
			should(beforeArgs)
				.have.property('query');

			should(afterReadCallback.callCount).be.equal(1);
			should(afterArgs).match({ hookName: 'find', context });
			should(afterArgs)
				.have.property('query');
			should(afterArgs)
				.have.property('result')
				.length(2);
		});
	});

	describe('findOne', () => {
		registerReadHooks({ read: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.findOne({ firstname: 'Mike' }, null, { context });
			const beforeArgs = beforeReadCallback.getCall(0).args[0];
			const afterArgs = afterReadCallback.getCall(0).args[0];

			should(beforeReadCallback.callCount).be.equal(1);
			should(beforeArgs).match({ hookName: 'findOne', context });
			should(beforeArgs)
				.have.property('query')

			should(afterReadCallback.callCount).be.equal(1);
			should(afterArgs).match({ hookName: 'findOne', context });
			should(afterArgs)
				.have.property('query');
			should(afterArgs)
				.have.property('result')
				.match({ firstname: 'Mike' });
		});
	});

	describe('findOneAndUpdate', () => {
		registerReadHooks({ read: true, write: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.findOneAndUpdate(
				{ firstname: 'Mike' },
				{ firstname: 'Michael' },
				{ context, new: true }
			);
			const beforeReadArgs = beforeReadCallback.getCall(0).args[0];
			const afterReadArgs = afterReadCallback.getCall(0).args[0];

			const beforeWriteArgs = beforeWriteCallback.getCall(0).args[0];
			const afterWriteArgs = afterWriteCallback.getCall(0).args[0];

			should(beforeReadCallback.callCount).be.equal(1);
			should(beforeReadArgs).match({ hookName: 'findOneAndUpdate', context });
			should(beforeReadArgs)
				.have.property('query');

			should(afterReadCallback.callCount).be.equal(1);
			should(afterReadArgs).match({ hookName: 'findOneAndUpdate', context });
			should(afterReadArgs)
				.have.property('query');
			should(afterReadArgs)
				.have.property('result')
				.match({ firstname: 'Michael' });

			should(beforeWriteCallback.callCount).be.equal(1);
			should(beforeWriteArgs).match({ hookName: 'findOneAndUpdate', context });
			should(beforeWriteArgs)
				.have.property('query');

			should(afterWriteCallback.callCount).be.equal(1);
			should(afterWriteArgs).match({ hookName: 'findOneAndUpdate', context });
			should(afterWriteArgs)
				.have.property('query');
			should(afterWriteArgs)
				.have.property('result')
				.match({ firstname: 'Michael' });
		});
	});

	describe('update', () => {
		registerReadHooks({ read: true, write: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.update({ firstname: 'Mike' }, { firstname: 'Michael' }, { context, new: true });
			const beforeReadArgs = beforeReadCallback.getCall(0).args[0];

			const beforeWriteArgs = beforeWriteCallback.getCall(0).args[0];
			const afterWriteArgs = afterWriteCallback.getCall(0).args[0];

			should(beforeReadCallback.callCount).be.equal(1);
			should(beforeReadArgs).match({ hookName: 'update', context });
			should(beforeReadArgs)
				.have.property('query');

			should(beforeWriteCallback.callCount).be.equal(1);
			should(beforeWriteArgs).match({ hookName: 'update', context });
			should(beforeWriteArgs)
				.have.property('query');

			should(afterWriteCallback.callCount).be.equal(1);
			should(afterWriteArgs).match({ hookName: 'update', context });
			should(afterWriteArgs)
				.have.property('query');
			should(afterWriteArgs).have.property('rawResult');
		});
	});

	describe('updateMany', () => {
		registerReadHooks({ read: true, write: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.updateMany({ firstname: 'Mike' }, { firstname: 'Michael' }, { context, new: true });
			const beforeReadArgs = beforeReadCallback.getCall(0).args[0];

			const beforeWriteArgs = beforeWriteCallback.getCall(0).args[0];
			const afterWriteArgs = afterWriteCallback.getCall(0).args[0];

			should(beforeReadCallback.callCount).be.equal(1);
			should(beforeReadArgs).match({ hookName: 'updateMany', context });
			should(beforeReadArgs)
				.have.property('query');

			should(beforeWriteCallback.callCount).be.equal(1);
			should(beforeWriteArgs).match({ hookName: 'updateMany', context });
			should(beforeWriteArgs)
				.have.property('query');

			should(afterWriteCallback.callCount).be.equal(1);
			should(afterWriteArgs).match({ hookName: 'updateMany', context });
			should(afterWriteArgs)
				.have.property('query');
			should(afterWriteArgs).have.property('rawResult');
		});
	});

	describe('updateOne', () => {
		registerReadHooks({ read: true, write: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.updateOne({ firstname: 'Mike' }, { firstname: 'Michael' }, { context, new: true });
			const beforeReadArgs = beforeReadCallback.getCall(0).args[0];

			const beforeWriteArgs = beforeWriteCallback.getCall(0).args[0];
			const afterWriteArgs = afterWriteCallback.getCall(0).args[0];

			should(beforeReadCallback.callCount).be.equal(1);
			should(beforeReadArgs).match({ hookName: 'updateOne', context });
			should(beforeReadArgs)
				.have.property('query');

			should(beforeWriteCallback.callCount).be.equal(1);
			should(beforeWriteArgs).match({ hookName: 'updateOne', context });
			should(beforeWriteArgs)
				.have.property('query');

			should(afterWriteCallback.callCount).be.equal(1);
			should(afterWriteArgs).match({ hookName: 'updateOne', context });
			should(afterWriteArgs)
				.have.property('query');
			should(afterWriteArgs).have.property('rawResult');
		});
	});

	describe('findOneAndDelete', () => {
		registerReadHooks({ delete: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.findOneAndDelete({ firstname: 'Mike' }, { context });
			const beforeDeleteArgs = beforeDeleteCallback.getCall(0).args[0];
			const afterDeleteArgs = afterDeleteCallback.getCall(0).args[0];

			should(beforeDeleteCallback.callCount).be.equal(1);
			should(beforeDeleteArgs).match({ hookName: 'findOneAndDelete', context });
			should(beforeDeleteArgs)
				.have.property('query');

			should(afterDeleteCallback.callCount).be.equal(1);
			should(afterDeleteArgs).match({ hookName: 'findOneAndDelete', context });
			should(afterDeleteArgs)
				.have.property('query');
			should(afterDeleteArgs)
				.have.property('result')
				.match({ firstname: 'Mike' });
			should(await CustomerModel.findOne({ firstname: 'Mike' })).be.null();
		});
	});

	describe('findOneAndRemove', () => {
		registerReadHooks({ delete: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.findOneAndRemove({ firstname: 'Mike' }, { context });
			const beforeDeleteArgs = beforeDeleteCallback.getCall(0).args[0];
			const afterDeleteArgs = afterDeleteCallback.getCall(0).args[0];

			should(beforeDeleteCallback.callCount).be.equal(1);
			should(beforeDeleteArgs).match({ hookName: 'findOneAndRemove', context });
			should(beforeDeleteArgs)
				.have.property('query');

			should(afterDeleteCallback.callCount).be.equal(1);
			should(afterDeleteArgs).match({ hookName: 'findOneAndRemove', context });
			should(afterDeleteArgs)
				.have.property('query');
			should(afterDeleteArgs)
				.have.property('result')
				.match({ firstname: 'Mike' });
			should(await CustomerModel.findOne({ firstname: 'Mike' })).be.null();
		});
	});

	describe('deleteOne', () => {
		registerReadHooks({ delete: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.deleteOne({ firstname: 'Mike' }).setOptions({ context });
			const beforeDeleteArgs = beforeDeleteCallback.getCall(0).args[0];
			const afterDeleteArgs = afterDeleteCallback.getCall(0).args[0];

			should(beforeDeleteCallback.callCount).be.equal(1);
			should(beforeDeleteArgs).match({ hookName: 'deleteOne', context });
			should(beforeDeleteArgs)
				.have.property('query');

			should(afterDeleteCallback.callCount).be.equal(1);
			should(afterDeleteArgs).match({ hookName: 'deleteOne', context });
			should(afterDeleteArgs)
				.have.property('query');
			should(afterDeleteArgs).have.property('rawResult');
			should(await CustomerModel.findOne({ firstname: 'Mike' })).be.null();
		});
	});

	describe('deleteMany', () => {
		registerReadHooks({ delete: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.deleteMany({ firstname: 'Mike' }).setOptions({ context });
			const beforeDeleteArgs = beforeDeleteCallback.getCall(0).args[0];
			const afterDeleteArgs = afterDeleteCallback.getCall(0).args[0];

			should(beforeDeleteCallback.callCount).be.equal(1);
			should(beforeDeleteArgs).match({ hookName: 'deleteMany', context });
			should(beforeDeleteArgs)
				.have.property('query');

			should(afterDeleteCallback.callCount).be.equal(1);
			should(afterDeleteArgs).match({ hookName: 'deleteMany', context });
			should(afterDeleteArgs)
				.have.property('query');
			should(afterDeleteArgs).have.property('rawResult');
			should(await CustomerModel.findOne({ firstname: 'Mike' })).be.null();
		});
	});

	describe('save', () => {
		registerReadHooks({ write: true });

		it('should correctly trigger the hooks', async () => {
			const customer = await CustomerModel.findOne({ firstname: 'Mike' }, null, { skipHooks: true });
			customer.firstname = 'Michael';

			await customer.save({ context });

			const beforeWriteArgs = beforeWriteCallback.getCall(0).args[0];
			const afterWriteArgs = afterWriteCallback.getCall(0).args[0];

			should(beforeWriteCallback.callCount).be.equal(1);
			should(beforeWriteArgs).match({ hookName: 'save', context });
			should(beforeWriteArgs)
				.have.property('doc')
				.have.property('firstname')
				.equal('Michael');

			should(afterWriteCallback.callCount).be.equal(1);
			should(afterWriteArgs).match({ hookName: 'save', context });
			should(afterWriteArgs)
				.have.property('result')
				.have.property('firstname')
				.equal('Michael');
		});
	});

	describe('remove', () => {
		registerReadHooks({ delete: true });

		it('should correctly trigger the hooks', async () => {
			const customer = await CustomerModel.findOne({ firstname: 'Mike' }, null, { skipHooks: true });

			await customer.remove({ context });

			const beforeDeleteArgs = beforeDeleteCallback.getCall(0).args[0];
			const afterDeleteArgs = afterDeleteCallback.getCall(0).args[0];

			should(beforeDeleteCallback.callCount).be.equal(1);
			should(beforeDeleteArgs).match({ hookName: 'remove' });
			should(beforeDeleteArgs)
				.have.property('doc')
				.have.property('firstname')
				.equal('Mike');

			should(afterDeleteCallback.callCount).be.equal(1);
			should(afterDeleteArgs).match({ hookName: 'remove' });
			should(afterDeleteArgs)
				.have.property('result')
				.have.property('firstname')
				.equal('Mike');
			should(await CustomerModel.findOne({ firstname: 'Mike' })).be.null();
		});
	});
});
