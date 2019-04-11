import should from 'should';
import { Model } from 'mongoose';
import { getSchemaDefinition, generateSchema, generateModel, mongooseProp, mongooseIndex } from '../../../src/mongoose';

describe('typed mongoose', () => {
	describe('#getSchemaDefinition', () => {
		it('supports primitive types', () => {
			class Customer {
				firstname: string;
				age: number;
				isActive: boolean;
			}
			mongooseProp({ type: String })(Customer.prototype, 'firstname');
			mongooseProp({ type: Number })(Customer.prototype, 'age');
			mongooseProp({ type: Boolean })(Customer.prototype, 'isActive');
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

			mongooseProp({ type: CustomerBirth })(Customer.prototype, 'birth');
			mongooseProp({ type: String })(CustomerBirth.prototype, 'place');
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

			mongooseProp({ type: [CustomerBirth] })(Customer.prototype, 'birth');
			mongooseProp({ type: [String] })(Customer.prototype, 'tags');
			mongooseProp({ type: String })(CustomerBirth.prototype, 'place');
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

			const schema = generateSchema(Customer);
			should(schema.statics.myStaticMethod).be.equal(Customer.myStaticMethod);
			should(schema.methods.myMethod).be.equal(Customer.prototype.myMethod);
		});

		it('should add the indexes', () => {
			class Customer {
				firstname: string;
				lastname: string;
			}

			mongooseProp({ type: String, index: true })(Customer.prototype, 'firstname');
			mongooseProp({ type: String })(Customer.prototype, 'lastname');
			mongooseIndex({ firstname: 1, lastname: 1 })(Customer);
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
