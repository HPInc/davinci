import should from 'should';
import _ from 'lodash';
import { withOperators, toMongodbQuery } from '../../src/queryHelpers';
import { field } from '../../src/decorators';
import { generateGQLSchema } from '../../src';
import { GraphQLBoolean, GraphQLFloat, GraphQLObjectType, GraphQLString } from 'graphql';

describe('mongooseHelpers', () => {
	describe('#toMongodbQuery', () => {
		it('should correctly transform the query', () => {
			const query = {
				firstname: { EQ: 'Mike' },
				lastname: { NOT: { EQ: 'Jordan' } },
				home: { address: { NE: 'Foobar' } },
				OR: [{ lastname: { IN: ['Foo'] } }, { lastname: { NIN: ['Bar'] } }],
				AND: [{ home: { address: { EXISTS: true } } }, { OR: [{ weight: { EQ: 122 } }, { age: { EQ: 30 } }] }]
			};

			const mongodbQuery = toMongodbQuery(query);

			should(mongodbQuery).be.deepEqual({
				firstname: {
					$eq: 'Mike'
				},
				lastname: {
					$not: {
						$eq: 'Jordan'
					}
				},
				'home.address': {
					$ne: 'Foobar'
				},
				$or: [
					{
						lastname: {
							$in: ['Foo']
						}
					},
					{
						lastname: {
							$nin: ['Bar']
						}
					}
				],
				$and: [
					{
						'home.address': {
							$exists: true
						}
					},
					{
						$or: [
							{
								weight: {
									$eq: 122
								}
							},
							{
								age: {
									$eq: 30
								}
							}
						]
					}
				]
			});
		});
	});

	describe('#withOperators', () => {
		it('should create a class with added operators', () => {
			class Phone {
				@field()
				isPrimary: boolean;

				@field()
				number: number;
			}

			class MyClass {
				@field()
				firstname: string;

				@field()
				phone: Phone;
			}

			const MyClassFilter = withOperators(MyClass);

			const { schema: gqlSchema } = generateGQLSchema({ type: MyClassFilter });
			const fields = gqlSchema.getFields();

			const firstnameFields = fields.firstname.type.getFields();
			const phoneFields = fields.phone.type.getFields();

			should(Object.keys(fields)).be.deepEqual(['firstname', 'phone', 'AND', 'OR', 'NOR']);
			should(Object.keys(firstnameFields)).be.deepEqual([
				'EQ',
				'NE',
				'GT',
				'GTE',
				'LT',
				'LTE',
				'IN',
				'NIN',
				'EXISTS',
				'NOT'
			]);
			should(firstnameFields.EQ.type).be.equal(GraphQLString);
			should(fields.phone.type).be.instanceOf(GraphQLObjectType);
			should(Object.keys(phoneFields)).be.deepEqual(['isPrimary', 'number', 'AND', 'OR', 'NOR']);
			should(Object.keys(phoneFields.number.type.getFields())).be.deepEqual([
				'EQ',
				'NE',
				'GT',
				'GTE',
				'LT',
				'LTE',
				'IN',
				'NIN',
				'EXISTS',
				'NOT'
			]);
			should(phoneFields.number.type.getFields().EQ.type).be.equal(GraphQLFloat);
			should(phoneFields.isPrimary.type.getFields().EQ.type).be.equal(GraphQLBoolean);
		});
	});
});
