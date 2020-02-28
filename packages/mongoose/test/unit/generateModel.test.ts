import should from 'should';
import Sinon from 'sinon';
import { Model, SchemaTypes } from 'mongoose';
import { mgoose } from '../../src';

const sinon = Sinon.createSandbox();

const { generateSchema, generateModel, prop, index, method, virtual } = mgoose;

describe('typed mongoose', () => {
	afterEach(() => {
		sinon.restore();
	});

	describe('schema generation', () => {
		it('supports primitive types', () => {
			class Customer {
				@prop()
				firstname: string;
				@prop()
				age: number;
				@prop()
				isActive: boolean;
			}

			const schema = generateSchema(Customer, {}, false);

			should(schema).be.deepEqual({
				firstname: {
					type: String
				},
				age: {
					type: Number
				},
				isActive: {
					type: Boolean
				}
			});
		});

		it('supports nested classes', () => {
			class CustomerBirth {
				@prop()
				place: string;
			}

			class Customer {
				@prop()
				birth: CustomerBirth;
			}

			const schema = generateSchema(Customer, {}, false);

			should(schema).be.deepEqual({
				birth: {
					type: {
						place: {
							type: String
						}
					}
				}
			});
		});

		it('supports arrays', () => {
			class CustomerBirth {
				@prop()
				place: string;
			}

			class Customer {
				@prop({ type: [CustomerBirth] })
				birth: CustomerBirth[];

				@prop({ type: [String] })
				tags: string[];
			}

			const schema = generateSchema(Customer, {}, false);

			should(schema).be.deepEqual({
				birth: [
					{
						type: {
							place: {
								type: String
							}
						}
					}
				],
				tags: [{ type: String }]
			});
		});

		it('supports class inheritance', () => {
			class BaseSchema {
				@prop()
				createdAt: string;
				@prop()
				updatedAt: number;
			}

			class MyClass1 extends BaseSchema {
				@prop()
				otherProp1: string;
			}

			class MyClass2 extends BaseSchema {
				@prop()
				otherProp2: string;
			}

			const schema1 = generateSchema(MyClass1, {}, false);
			const schema2 = generateSchema(MyClass2, {}, false);
			const baseSchema = generateSchema(BaseSchema, {}, false);

			should(Object.keys(schema1)).be.deepEqual(['createdAt', 'updatedAt', 'otherProp1']);
			should(Object.keys(schema2)).be.deepEqual(['createdAt', 'updatedAt', 'otherProp2']);
			should(Object.keys(baseSchema)).be.deepEqual(['createdAt', 'updatedAt']);
		});
	});

	describe('#generateSchema', () => {
		it('attach statics and model methods', () => {
			class Customer {
				@method()
				static myStaticMethod() {}

				@method()
				myMethod() {}
			}

			const schema = generateSchema(Customer);
			should(schema.statics.myStaticMethod).be.equal(Customer.myStaticMethod);
			should(schema.methods.myMethod).be.equal(Customer.prototype.myMethod);
		});

		it('should add the indexes', () => {
			@index({ firstname: 1, lastname: 1 })
			@index({ lastname: 1, unique: true })
			class Customer {
				@prop({ index: true })
				firstname: string;

				@prop()
				lastname: string;
			}

			const schema = generateSchema(Customer);
			should(schema.indexes()).be.deepEqual([
				[
					{
						firstname: 1
					},
					{
						background: true
					}
				],
				[
					{
						lastname: 1,
						unique: true
					},
					{
						background: true
					}
				],
				[
					{
						firstname: 1,
						lastname: 1
					},
					{
						background: true
					}
				]
			]);
		});

		it('should add validators', () => {
			const validateFn = sinon.stub().returns(true);

			class Customer {
				@prop({ validate: validateFn })
				firstname: string;
			}

			const schema = generateSchema(Customer);
			// @ts-ignore
			should(schema.path('firstname').validators).match([{ validator: validateFn }]);
		});

		it('should support passing raw mongoose types', () => {
			class Customer {
				@prop({ required: true, index: true, rawType: SchemaTypes.Decimal128 })
				firstname: string;
			}

			const schema = generateSchema(Customer);
			// @ts-ignore
			should(schema.path('firstname')).be.instanceOf(SchemaTypes.Decimal128);
			should(schema.path('firstname')).match({
				options: { required: true, index: true }
			});
		});

		it('should support attaching mongoose functionalities to sub-schemas', () => {
			class Item {
				@virtual()
				categories() {}
			}

			class Order {
				@prop({ index: true })
				firstname: string;

				@prop({ type: [Item] })
				items: Item[];
			}

			const schema = generateSchema(Order);
			should(schema.path('items').schema.virtualpath('categories')).be.ok();
		});
	});

	describe('#generateModel', () => {
		it('should generate a mongoose model', () => {
			class Customer {
				firstname: string;
			}
			const CustomerModel = generateModel(Customer);
			should(CustomerModel.prototype).be.instanceOf(Model);
		});
	});
});
