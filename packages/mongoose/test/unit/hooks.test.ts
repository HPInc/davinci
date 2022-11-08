/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '../support/chai';
import mongoose, { Model } from 'mongoose';
import Sinon from 'sinon';
import { mgoose } from '../../src';

const { beforeRead, afterRead, beforeWrite, afterWrite, beforeDelete, afterDelete } = mgoose;

const sinon = Sinon.createSandbox();

describe('mongoose hooks', () => {
	let CustomerSchema;
	let CustomerModel: Model<any>;
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
				beforeRead(CustomerSchema, ({}) => {});
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
			await CustomerModel.find({}, null, { davinciContext: context }).countDocuments();
			const beforeArgs = beforeReadCallback.getCall(0).args[0];
			const afterArgs = afterReadCallback.getCall(0).args[0];

			expect(beforeReadCallback.callCount).be.equal(1);
			expect(beforeArgs).to.containSubset({ hookName: 'countDocuments', context, davinciContext: context });
			expect(beforeArgs).have.property('query');

			expect(afterReadCallback.callCount).be.equal(1);
			expect(afterArgs).to.containSubset({
				hookName: 'countDocuments',
				count: 2,
				context,
				davinciContext: context
			});
			expect(afterArgs).have.property('query');
		});
	});

	describe('find', () => {
		registerReadHooks({ read: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.find({}, null, { davinciContext: context });
			const beforeArgs = beforeReadCallback.getCall(0).args[0];
			const afterArgs = afterReadCallback.getCall(0).args[0];

			expect(beforeReadCallback.callCount).be.equal(1);
			expect(beforeArgs).to.containSubset({ hookName: 'find', context, davinciContext: context });
			expect(beforeArgs).have.property('query');

			expect(afterReadCallback.callCount).be.equal(1);
			expect(afterArgs).to.containSubset({ hookName: 'find', context, davinciContext: context });
			expect(afterArgs).have.property('query');
			expect(afterArgs).have.property('result').length(2);
		});
	});

	describe('findOne', () => {
		registerReadHooks({ read: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.findOne({ firstname: 'Mike' }, null, { davinciContext: context });
			const beforeArgs = beforeReadCallback.getCall(0).args[0];
			const afterArgs = afterReadCallback.getCall(0).args[0];

			expect(beforeReadCallback.callCount).be.equal(1);
			expect(beforeArgs).to.containSubset({ hookName: 'findOne', context, davinciContext: context });
			expect(beforeArgs).have.property('query');

			expect(afterReadCallback.callCount).be.equal(1);
			expect(afterArgs).to.containSubset({ hookName: 'findOne', context, davinciContext: context });
			expect(afterArgs).have.property('query');
			expect(afterArgs).have.property('result').to.containSubset({ firstname: 'Mike' });
		});
	});

	describe('findOneAndUpdate', () => {
		registerReadHooks({ read: true, write: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.findOneAndUpdate(
				{ firstname: 'Mike' },
				{ firstname: 'Michael' },
				{ davinciContext: context, new: true }
			);
			const beforeReadArgs = beforeReadCallback.getCall(0).args[0];
			const afterReadArgs = afterReadCallback.getCall(0).args[0];

			const beforeWriteArgs = beforeWriteCallback.getCall(0).args[0];
			const afterWriteArgs = afterWriteCallback.getCall(0).args[0];

			expect(beforeReadCallback.callCount).be.equal(1);
			expect(beforeReadArgs).to.containSubset({ hookName: 'findOneAndUpdate', context, davinciContext: context });
			expect(beforeReadArgs).have.property('query');

			expect(afterReadCallback.callCount).be.equal(1);
			expect(afterReadArgs).to.containSubset({ hookName: 'findOneAndUpdate', context, davinciContext: context });
			expect(afterReadArgs).have.property('query');
			expect(afterReadArgs).have.property('result').to.containSubset({ firstname: 'Michael' });

			expect(beforeWriteCallback.callCount).be.equal(1);
			expect(beforeWriteArgs).to.containSubset({
				hookName: 'findOneAndUpdate',
				context,
				davinciContext: context
			});
			expect(beforeWriteArgs).have.property('query');

			expect(afterWriteCallback.callCount).be.equal(1);
			expect(afterWriteArgs).to.containSubset({ hookName: 'findOneAndUpdate', context, davinciContext: context });
			expect(afterWriteArgs).have.property('query');
			expect(afterWriteArgs).have.property('result').to.containSubset({ firstname: 'Michael' });
		});
	});

	describe('update', () => {
		registerReadHooks({ read: true, write: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.update(
				{ firstname: 'Mike' },
				{ firstname: 'Michael' },
				{ davinciContext: context, new: true }
			);
			const beforeReadArgs = beforeReadCallback.getCall(0).args[0];

			const beforeWriteArgs = beforeWriteCallback.getCall(0).args[0];
			const afterWriteArgs = afterWriteCallback.getCall(0).args[0];

			expect(beforeReadCallback.callCount).be.equal(1);
			expect(beforeReadArgs).to.containSubset({ hookName: 'update', context, davinciContext: context });
			expect(beforeReadArgs).have.property('query');

			expect(beforeWriteCallback.callCount).be.equal(1);
			expect(beforeWriteArgs).to.containSubset({ hookName: 'update', context, davinciContext: context });
			expect(beforeWriteArgs).have.property('query');

			expect(afterWriteCallback.callCount).be.equal(1);
			expect(afterWriteArgs).to.containSubset({ hookName: 'update', context, davinciContext: context });
			expect(afterWriteArgs).have.property('query');
			expect(afterWriteArgs).have.property('rawResult');
		});
	});

	describe('updateMany', () => {
		registerReadHooks({ read: true, write: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.updateMany(
				{ firstname: 'Mike' },
				{ firstname: 'Michael' },
				{ davinciContext: context, new: true }
			);
			const beforeReadArgs = beforeReadCallback.getCall(0).args[0];

			const beforeWriteArgs = beforeWriteCallback.getCall(0).args[0];
			const afterWriteArgs = afterWriteCallback.getCall(0).args[0];

			expect(beforeReadCallback.callCount).be.equal(1);
			expect(beforeReadArgs).to.containSubset({ hookName: 'updateMany', context, davinciContext: context });
			expect(beforeReadArgs).have.property('query');

			expect(beforeWriteCallback.callCount).be.equal(1);
			expect(beforeWriteArgs).to.containSubset({ hookName: 'updateMany', context, davinciContext: context });
			expect(beforeWriteArgs).have.property('query');

			expect(afterWriteCallback.callCount).be.equal(1);
			expect(afterWriteArgs).to.containSubset({ hookName: 'updateMany', context, davinciContext: context });
			expect(afterWriteArgs).have.property('query');
			expect(afterWriteArgs).have.property('rawResult');
		});
	});

	describe('updateOne', () => {
		registerReadHooks({ read: true, write: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.updateOne(
				{ firstname: 'Mike' },
				{ firstname: 'Michael' },
				{ davinciContext: context, new: true }
			);
			const beforeReadArgs = beforeReadCallback.getCall(0).args[0];

			const beforeWriteArgs = beforeWriteCallback.getCall(0).args[0];
			const afterWriteArgs = afterWriteCallback.getCall(0).args[0];

			expect(beforeReadCallback.callCount).be.equal(1);
			expect(beforeReadArgs).to.containSubset({ hookName: 'updateOne', context, davinciContext: context });
			expect(beforeReadArgs).have.property('query');

			expect(beforeWriteCallback.callCount).be.equal(1);
			expect(beforeWriteArgs).to.containSubset({ hookName: 'updateOne', context, davinciContext: context });
			expect(beforeWriteArgs).have.property('query');

			expect(afterWriteCallback.callCount).be.equal(1);
			expect(afterWriteArgs).to.containSubset({ hookName: 'updateOne', context, davinciContext: context });
			expect(afterWriteArgs).have.property('query');
			expect(afterWriteArgs).have.property('rawResult');
		});
	});

	describe('findOneAndDelete', () => {
		registerReadHooks({ delete: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.findOneAndDelete({ firstname: 'Mike' }, { davinciContext: context });
			const beforeDeleteArgs = beforeDeleteCallback.getCall(0).args[0];
			const afterDeleteArgs = afterDeleteCallback.getCall(0).args[0];

			expect(beforeDeleteCallback.callCount).be.equal(1);
			expect(beforeDeleteArgs).to.containSubset({
				hookName: 'findOneAndDelete',
				context,
				davinciContext: context
			});
			expect(beforeDeleteArgs).have.property('query');

			expect(afterDeleteCallback.callCount).be.equal(1);
			expect(afterDeleteArgs).to.containSubset({
				hookName: 'findOneAndDelete',
				context,
				davinciContext: context
			});
			expect(afterDeleteArgs).have.property('query');
			expect(afterDeleteArgs).have.property('result').to.containSubset({ firstname: 'Mike' });
			expect(await CustomerModel.findOne({ firstname: 'Mike' })).be.null;
		});
	});

	describe('findOneAndRemove', () => {
		registerReadHooks({ delete: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.findOneAndRemove({ firstname: 'Mike' }, { davinciContext: context });
			const beforeDeleteArgs = beforeDeleteCallback.getCall(0).args[0];
			const afterDeleteArgs = afterDeleteCallback.getCall(0).args[0];

			expect(beforeDeleteCallback.callCount).be.equal(1);
			expect(beforeDeleteArgs).to.containSubset({
				hookName: 'findOneAndRemove',
				context,
				davinciContext: context
			});
			expect(beforeDeleteArgs).have.property('query');

			expect(afterDeleteCallback.callCount).be.equal(1);
			expect(afterDeleteArgs).to.containSubset({
				hookName: 'findOneAndRemove',
				context,
				davinciContext: context
			});
			expect(afterDeleteArgs).have.property('query');
			expect(afterDeleteArgs).have.property('result').to.containSubset({ firstname: 'Mike' });
			expect(await CustomerModel.findOne({ firstname: 'Mike' })).be.null;
		});
	});

	describe('deleteOne', () => {
		registerReadHooks({ delete: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.deleteOne({ firstname: 'Mike' }).setOptions({ davinciContext: context });
			const beforeDeleteArgs = beforeDeleteCallback.getCall(0).args[0];
			const afterDeleteArgs = afterDeleteCallback.getCall(0).args[0];

			expect(beforeDeleteCallback.callCount).be.equal(1);
			expect(beforeDeleteArgs).to.containSubset({ hookName: 'deleteOne', context, davinciContext: context });
			expect(beforeDeleteArgs).have.property('query');

			expect(afterDeleteCallback.callCount).be.equal(1);
			expect(afterDeleteArgs).to.containSubset({ hookName: 'deleteOne', context, davinciContext: context });
			expect(afterDeleteArgs).have.property('query');
			expect(afterDeleteArgs).have.property('rawResult');
			expect(await CustomerModel.findOne({ firstname: 'Mike' })).be.null;
		});
	});

	describe('deleteMany', () => {
		registerReadHooks({ delete: true });

		it('should correctly trigger the hooks', async () => {
			await CustomerModel.deleteMany({ firstname: 'Mike' }).setOptions({ davinciContext: context });
			const beforeDeleteArgs = beforeDeleteCallback.getCall(0).args[0];
			const afterDeleteArgs = afterDeleteCallback.getCall(0).args[0];

			expect(beforeDeleteCallback.callCount).be.equal(1);
			expect(beforeDeleteArgs).to.containSubset({ hookName: 'deleteMany', context, davinciContext: context });
			expect(beforeDeleteArgs).have.property('query');

			expect(afterDeleteCallback.callCount).be.equal(1);
			expect(afterDeleteArgs).to.containSubset({ hookName: 'deleteMany', context, davinciContext: context });
			expect(afterDeleteArgs).have.property('query');
			expect(afterDeleteArgs).have.property('rawResult');
			expect(await CustomerModel.findOne({ firstname: 'Mike' })).be.null;
		});
	});

	describe('save', () => {
		registerReadHooks({ write: true });

		it('should correctly trigger the hooks', async () => {
			const customer = await CustomerModel.findOne({ firstname: 'Mike' }, null, { skipHooks: true });
			customer.firstname = 'Michael';

			await customer.save({ davinciContext: context });

			const beforeWriteArgs = beforeWriteCallback.getCall(0).args[0];
			const afterWriteArgs = afterWriteCallback.getCall(0).args[0];

			expect(beforeWriteCallback.callCount).be.equal(1);
			expect(beforeWriteArgs).to.containSubset({ hookName: 'save', context, davinciContext: context });
			expect(beforeWriteArgs).have.property('doc').have.property('firstname').equal('Michael');

			expect(afterWriteCallback.callCount).be.equal(1);
			expect(afterWriteArgs).to.containSubset({ hookName: 'save', context, davinciContext: context });
			expect(afterWriteArgs).have.property('result').have.property('firstname').equal('Michael');
		});
	});

	describe('remove', () => {
		registerReadHooks({ delete: true });

		it('should correctly trigger the hooks', async () => {
			const customer = await CustomerModel.findOne({ firstname: 'Mike' }, null, { skipHooks: true });

			await customer.remove();

			const beforeDeleteArgs = beforeDeleteCallback.getCall(0).args[0];
			const afterDeleteArgs = afterDeleteCallback.getCall(0).args[0];

			expect(beforeDeleteCallback.callCount).be.equal(1);
			expect(beforeDeleteArgs).to.containSubset({ hookName: 'remove' });
			expect(beforeDeleteArgs).have.property('doc').have.property('firstname').equal('Mike');

			expect(afterDeleteCallback.callCount).be.equal(1);
			expect(afterDeleteArgs).to.containSubset({ hookName: 'remove' });
			expect(afterDeleteArgs).have.property('result').have.property('firstname').equal('Mike');
			expect(await CustomerModel.findOne({ firstname: 'Mike' })).be.null;
		});
	});
});
