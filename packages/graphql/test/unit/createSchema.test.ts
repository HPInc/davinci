import should from 'should';
import { graphql } from '../../src';
import { print } from 'graphql';

const { prop, getSchema } = graphql;

describe('typed grapqhl', () => {
	describe('#getSchema', () => {
		it('supports primitive types', () => {
			class Customer {
				firstname: string;
				age: number;
				isActive: boolean;
			}
			prop({
				type: String
			})(Customer.prototype, 'firstname');
			prop({
				type: Number
			})(Customer.prototype, 'age');
			prop({
				type: Boolean
			})(Customer.prototype, 'isActive');
			const { schema } = getSchema(Customer);

			const schemaLanguage = print(schema);
			console.log(schemaLanguage);

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

			prop({
				type: CustomerBirth
			})(Customer.prototype, 'birth');
			prop({
				type: String
			})(CustomerBirth.prototype, 'place');
			const schema = getSchema(Customer);

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

			prop({
				type: [CustomerBirth]
			})(Customer.prototype, 'birth');
			prop({
				type: [String]
			})(Customer.prototype, 'tags');
			prop({
				type: String
			})(CustomerBirth.prototype, 'place');
			const schema = getSchema(Customer);

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

	/*describe('#generateModel', () => {
		it('should generate a mongoose model', () => {
			class Customer {
				firstname: string;
			}
			const CustomerModel = generateModel(Customer);
			should(CustomerModel.prototype).be.instanceOf(Model);
		});
	});*/
});
