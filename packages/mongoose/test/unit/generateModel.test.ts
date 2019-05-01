import should from 'should';
import { Model } from 'mongoose';
import { mgoose } from '../../src';

const { getSchemaDefinition, generateSchema, generateModel, prop, index, method } = mgoose;

describe('typed mongoose', () => {
	describe('#getSchemaDefinition', () => {
		it('supports primitive types', () => {
			class Customer {
				firstname: string;
				age: number;
				isActive: boolean;
			}
			prop({ type: String })(Customer.prototype, 'firstname');
			prop({ type: Number })(Customer.prototype, 'age');
			prop({ type: Boolean })(Customer.prototype, 'isActive');
			const schema = getSchemaDefinition(Customer);

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
				place: string;
			}

			class Customer {
				birth: CustomerBirth;
			}

			prop({ type: CustomerBirth })(Customer.prototype, 'birth');
			prop({ type: String })(CustomerBirth.prototype, 'place');
			const schema = getSchemaDefinition(Customer);

			should(schema).be.deepEqual({
				birth: {
					place: {
						type: String
					}
				}
			});
		});

		it('supports arrays', () => {
			class CustomerBirth {
				place: string;
			}

			class Customer {
				birth: CustomerBirth[];
				tags: string[];
			}

			prop({ type: [CustomerBirth] })(Customer.prototype, 'birth');
			prop({ type: [String] })(Customer.prototype, 'tags');
			prop({ type: String })(CustomerBirth.prototype, 'place');
			const schema = getSchemaDefinition(Customer);

			should(schema).be.deepEqual({
				birth: [
					{
						place: {
							type: String
						}
					}
				],
				tags: [{ type: String }]
			});
		});
	});

	describe('#generateSchema', () => {
		it('attach statics and model methods', () => {
			class Customer {
				static myStaticMethod() {}
				myMethod() {}
			}

			method()(Customer, 'myStaticMethod');
			method()(Customer.prototype, 'myMethod');
			const schema = generateSchema(Customer);
			should(schema.statics.myStaticMethod).be.equal(Customer.myStaticMethod);
			should(schema.methods.myMethod).be.equal(Customer.prototype.myMethod);
		});

		it('should add the indexes', () => {
			class Customer {
				firstname: string;
				lastname: string;
			}

			prop({ type: String, index: true })(Customer.prototype, 'firstname');
			prop({ type: String })(Customer.prototype, 'lastname');
			index({ firstname: 1, lastname: 1 })(Customer);
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
					[
						{
							firstname: 1,
							lastname: 1
						}
					],
					{
						background: true
					}
				]
			]);
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
