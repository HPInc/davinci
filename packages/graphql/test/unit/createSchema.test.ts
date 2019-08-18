import should from 'should';
import { GraphQLObjectType, GraphQLString } from 'graphql';
import { graphql } from '../../src';

const { field, getSchema } = graphql;

describe('typed grapqhl', () => {
	describe('#getSchema', () => {
		it('supports primitive types', () => {
			class Customer {
				firstname: string;
				age: number;
				isActive: boolean;
			}
			field({
				type: String
			})(Customer.prototype, 'firstname');
			field({
				type: Number
			})(Customer.prototype, 'age');
			field({
				type: Boolean
			})(Customer.prototype, 'isActive');
			const { schema } = getSchema(Customer);

			should(schema)
				.have.property('name')
				.equal('Customer');
			const fields = schema.getFields();
			should(Object.keys(fields)).be.deepEqual(['firstname', 'age', 'isActive']);
			should(fields.firstname.description).containEql('String');
			should(fields.age.description).containEql('Float');
			should(fields.isActive.description).containEql('Boolean');
		});

		it('supports nested classes', () => {
			class CustomerBirth {
				place: string;
			}

			class Customer {
				birth: CustomerBirth;
			}

			field({
				type: CustomerBirth
			})(Customer.prototype, 'birth');
			field({
				type: String
			})(CustomerBirth.prototype, 'place');
			const { schemas } = getSchema(Customer);

			should(schemas)
				.have.property('CustomerBirth')
				.instanceOf(GraphQLObjectType);
			should(schemas)
				.have.property('Customer')
				.instanceOf(GraphQLObjectType);

			// @ts-ignore
			const { Customer: C, CustomerBirth: CB } = schemas;
			should(C.getFields()).have.property('birth');
			// @ts-ignore
			should(CB.getFields()).have.property('place');
		});

		it('supports arrays', () => {
			class CustomerPhone {
				number: string;
			}

			class Customer {
				birth: CustomerPhone[];
				tags: string[];
			}

			field({
				type: [CustomerPhone]
			})(Customer.prototype, 'phones');
			field({
				type: [String]
			})(Customer.prototype, 'tags');
			field({
				type: String
			})(CustomerPhone.prototype, 'number');
			const { schemas } = getSchema(Customer);

			// @ts-ignore
			const { Customer: C, CustomerPhone: CB } = schemas;
			should(Object.keys(C.getFields())).be.deepEqual(['phones', 'tags']);
			should(Object.keys(CB.getFields())).be.deepEqual(['number']);

			should(C.getFields().tags)
				.have.property('ofType')
				.equal(GraphQLString);

			should(C.getFields().phones)
				.have.property('ofType')
				.instanceOf(GraphQLObjectType)
				.have.property('name')
				.equal('CustomerPhone');
		});
	});
});
