import should from 'should';
import mongoose from 'mongoose';
import { createMongooseController, mgoose } from '../../src';

const { prop } = mgoose;

describe('createMongooseController', () => {
	let CustomerModel;
	let CustomerSchema;

	beforeEach(() => {
		mongoose.models = {};
		// @ts-ignore
		mongoose.modelSchemas = {};

		CustomerSchema = class {
			firstname: string;
		};
		prop({ type: String })(CustomerSchema.prototype, 'firstname');

		CustomerModel = mgoose.generateModel(CustomerSchema, 'Customer');
	});

	it('should create a class with base methods', () => {
		const MongooseController = createMongooseController(CustomerModel, CustomerSchema);
		[
			'create',
			'deleteById',
			'find',
			'findOne',
			'parsePopulate',
			'parseQuery',
			'findById',
			'create',
			'updateById'
		].forEach(methodName => should(MongooseController.prototype[methodName]).be.a.Function());
	});

	it('should correctly use the schema to set argument types', () => {
		const MongooseController = createMongooseController(CustomerModel, CustomerSchema);

		const [Schema] = Reflect.getMetadata('design:paramtypes', MongooseController.prototype, 'create');
		should(Schema.prototype).be.instanceOf(CustomerSchema);

		const methodsMeta = Reflect.getMetadata('tsopenapi:methods', MongooseController.prototype);
		const findByIdMethod = methodsMeta.find(({ methodName }) => methodName === 'findById');
		should(findByIdMethod.responses['200'].prototype).be.instanceof(CustomerSchema);
	});
});
