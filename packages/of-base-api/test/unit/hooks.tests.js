const sinon = require('sinon');
const mongoose = require('mongoose');
const ObjectId = require('mongoose').mongo.ObjectId;
const MongooseModel = require('../../src/MongooseModel');

const connectToMongodb = () => {
	mongoose.Promise = global.Promise;
	mongoose.set('debug', true);
	return mongoose.connect(process.env.MONGODB_URL, { useMongoClient: true });
};

const schema = { firstname: String };

describe('hooks', () => {
	let customerModel;
	const sandbox = sinon.createSandbox();
	before(async () => {
		await connectToMongodb();
		customerModel = new MongooseModel('Customer', schema, 'customers');
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('methods', () => {
		describe('find', () => {
			it('should trigger the \'all\' and \'find\' hooks', async () => {
				const beforeAllCallback = sandbox.spy();
				const beforeMethodCallback = sandbox.spy();
				const afterFindCallback = sandbox.spy();

				customerModel.before('all', beforeAllCallback);
				customerModel.before('find', beforeMethodCallback);
				customerModel.after('find', afterFindCallback);

				await customerModel.find({ query: { name: 'mike' } });

				beforeAllCallback.calledOnce.should.be.equal(true);
				beforeAllCallback.args[0][0].method.should.be.equal('find');
				beforeAllCallback.args[0][0].params.query.should.be.deepEqual({
					name: 'mike'
				});
				beforeMethodCallback.calledOnce.should.be.equal(true);
			});
		});

		describe('findOne', () => {
			it('should trigger the \'all\' and \'find\' hooks', async () => {
				const beforeAllCallback = sandbox.spy();
				const beforeMethodCallback = sandbox.spy();
				const afterFindCallback = sandbox.spy();

				customerModel.before('all', beforeAllCallback);
				customerModel.before('findOne', beforeMethodCallback);
				customerModel.after('findOne', afterFindCallback);

				await customerModel.findOne({ query: { name: 'mike' } });

				beforeAllCallback.calledOnce.should.be.equal(true);
				beforeAllCallback.args[0][0].method.should.be.equal('findOne');
				beforeAllCallback.args[0][0].params.query.should.be.deepEqual({
					name: 'mike'
				});
				beforeMethodCallback.calledOnce.should.be.equal(true);
			});
		});

		describe('create', () => {
			it('should trigger the \'all\' and \'create\' hooks', async () => {
				const beforeAllCallback = sandbox.spy();
				const beforeMethodCallback = sandbox.spy();
				const afterFindCallback = sandbox.spy();

				customerModel.before('all', beforeAllCallback);
				customerModel.before('create', beforeMethodCallback);
				customerModel.after('create', afterFindCallback);

				await customerModel.create({ name: 'mike' });

				beforeAllCallback.calledOnce.should.be.equal(true);
				beforeAllCallback.args[0][0].method.should.be.equal('create');
				beforeAllCallback.args[0][0].data.should.be.deepEqual({
					name: 'mike'
				});
				beforeMethodCallback.calledOnce.should.be.equal(true);
			});
		});

		describe('update', () => {
			it('should trigger the \'all\' and \'update\' hooks', async () => {
				const beforeAllCallback = sandbox.spy();
				const beforeMethodCallback = sandbox.spy();
				const afterFindCallback = sandbox.spy();

				customerModel.before('all', beforeAllCallback);
				customerModel.before('update', beforeMethodCallback);
				customerModel.after('update', afterFindCallback);

				await customerModel.update(new ObjectId(), { name: 'mike' });

				beforeAllCallback.calledOnce.should.be.equal(true);
				beforeAllCallback.args[0][0].method.should.be.equal('update');
				beforeAllCallback.args[0][0].data.should.be.deepEqual({
					name: 'mike'
				});
				beforeMethodCallback.calledOnce.should.be.equal(true);
			});
		});

		describe('patch', () => {
			it('should trigger the \'all\' and \'patch\' hooks', async () => {
				const beforeAllCallback = sandbox.spy();
				const beforeMethodCallback = sandbox.spy();
				const afterFindCallback = sandbox.spy();

				customerModel.before('all', beforeAllCallback);
				customerModel.before('patch', beforeMethodCallback);
				customerModel.after('patch', afterFindCallback);

				await customerModel.patch(
					null,
					{ name: 'newName' },
					{ query: { name: 'oldName' } }
				);

				beforeAllCallback.calledOnce.should.be.equal(true);
				beforeAllCallback.args[0][0].method.should.be.equal('patch');
				beforeAllCallback.args[0][0].data.should.be.deepEqual({
					name: 'newName'
				});
				beforeAllCallback.args[0][0].params.query.should.be.deepEqual({
					name: 'oldName'
				});
				beforeMethodCallback.calledOnce.should.be.equal(true);
			});
		});

		describe('remove', () => {
			it('should trigger the \'all\' and \'remove\' hooks', async () => {
				const beforeAllCallback = sandbox.spy();
				const beforeMethodCallback = sandbox.spy();
				const afterFindCallback = sandbox.spy();

				customerModel.before('all', beforeAllCallback);
				customerModel.before('remove', beforeMethodCallback);
				customerModel.after('remove', afterFindCallback);

				await customerModel.remove(null, { query: { name: 'mike' } });

				beforeAllCallback.calledOnce.should.be.equal(true);
				beforeAllCallback.args[0][0].method.should.be.equal('remove');
				beforeAllCallback.args[0][0].params.query.should.be.deepEqual({
					name: 'mike'
				});
				beforeMethodCallback.calledOnce.should.be.equal(true);
			});
		});
	});

	describe('context', () => {
		it('should correctly propagate the context', async () => {
			customerModel.before('find', hook => (hook.newProperty = true));
			customerModel.after('find', hook => {
				hook.newProperty.should.be.equal(true);
			});

			await customerModel.find({ query: { name: 'mike' } });
		});
	});

	describe('result', () => {
		it('should stop the original method and return', async () => {
			customerModel.before('find', hook => (hook.result = { name: 'mike' }));

			const result = await customerModel.find({ query: { name: 'mike' } });
			result.should.be.deepEqual({ name: 'mike' });
		});
	});
});
