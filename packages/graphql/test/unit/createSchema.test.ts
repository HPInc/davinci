import should from 'should';
import { graphql } from '../../src';

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

			should(schema)
				.have.property('name')
				.equal('Customer');
			const fields = schema.getFields();
			should(Object.keys(fields)).be.deepEqual(['firstname', 'age', 'isActive']);
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
