import should from 'should';
import { GraphQLBoolean, GraphQLFloat, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLUnionType } from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLJSONObject } from 'graphql-type-json';
import _fp from 'lodash/fp';
import { graphql, generateGQLSchema, UnionType } from '../../src';
import { fieldResolver } from '../../src/decorators';

const { field } = graphql;

describe('schema generation', () => {
	describe('#generateGQLSchema', () => {
		it('supports primitive types', () => {
			class Customer {
				@field()
				firstname: string;
				@field()
				age: number;
				@field()
				isActive: boolean;
				@field()
				date: Date
				@field()
				blob: Object

				@field({ type: String })
				something() {}
			}

			const { schema } = generateGQLSchema({ type: Customer });

			should(schema)
				.have.property('name')
				.equal('Customer');
			const fields = schema.getFields();

			should(Object.keys(fields)).be.deepEqual(['firstname', 'age', 'isActive', 'date', 'blob', 'something']);
			should(fields.firstname.type).be.equal(GraphQLString);
			should(fields.age.type).be.equal(GraphQLFloat);
			should(fields.isActive.type).be.equal(GraphQLBoolean);
			should(fields.date.type).be.equal(GraphQLDateTime);
			should(fields.blob.type).be.equal(GraphQLJSONObject);
			should(fields.something.type).be.equal(GraphQLString);
		});

		it('supports nested classes', () => {
			class CustomerBirth {
				@field()
				place: string;
			}

			class Customer {
				@field()
				birth: CustomerBirth;
			}

			const { schemas } = generateGQLSchema({ type: Customer });

			should(schemas)
				.have.property('Customer')
				.instanceOf(GraphQLObjectType);

			// @ts-ignore
			const { birth } = schemas.Customer.getFields();
			should(birth.type).be.instanceOf(GraphQLObjectType);
			// @ts-ignore
			const { place } = schemas.CustomerBirth.getFields();
			should(place.type).be.equal(GraphQLString);
		});

		it('should pass fields defined as function as resolve', () => {
			class Customer {
				@field({ type: String })
				something(parent, args, context, info) {
					return { parent, args, context, info };
				}

				@field({ type: [Number] })
				somethingArray(parent, args, context, info) {
					return { parent, args, context, info };
				}
			}

			const { schema } = generateGQLSchema({ type: Customer });

			should(schema).be.instanceOf(GraphQLObjectType);

			// @ts-ignore
			const { something, somethingArray } = schema.getFields();

			should(something.type).be.equal(GraphQLString);
			should(something.resolve).be.equal(Customer.prototype.something);
			should(somethingArray.type).be.instanceOf(GraphQLList);
			should(somethingArray.type.ofType).be.equal(GraphQLFloat);
			should(somethingArray.resolve).be.equal(Customer.prototype.somethingArray);
		});

		it('should create an external resolver', () => {
			class Book {}
			class Author {
				@field()
				title: string;
			}

			// @ts-ignore
			class AuthorController {
				@fieldResolver(Book, 'authors', [Author])
				getBookAuthors() {}
			}

			const { schema } = generateGQLSchema({ type: Book });

			should(schema).be.instanceOf(GraphQLObjectType);

			// @ts-ignore
			const { authors } = schema.getFields();

			should(authors.type).be.instanceOf(GraphQLList);
			should(authors.type.ofType).be.instanceOf(GraphQLObjectType);
			should(authors.resolve).be.type('function');
		});

		it('supports arrays', () => {
			class CustomerPhone {
				@field()
				number: string;
			}

			class Customer {
				@field({ type: [CustomerPhone] })
				phones: CustomerPhone[];
				@field({ type: [String] })
				tags: string[];
			}

			const schemas: any = generateGQLSchema({ type: Customer }).schemas;

			should(Object.keys(schemas.Customer.getFields())).be.deepEqual(['phones', 'tags']);
			should(Object.keys(schemas.CustomerPhone.getFields())).be.deepEqual(['number']);

			const { tags, phones } = schemas.Customer.getFields();

			should(tags.type)
				.be.instanceOf(GraphQLList)
				.have.property('ofType')
				.equal(GraphQLString);

			should(phones.type)
				.be.instanceOf(GraphQLList)
				.have.property('ofType')
				.equal(schemas.CustomerPhone);
		});

		it('supports union types', () => {
			class Cat {
				@field()
				breed: string;
			}

			class Human {
				@field()
				phone: string;
			}

			const resolveType = () => 'Human';
			const Animal = new UnionType('Animal', [Cat, Human], resolveType);

			const schemas: any = generateGQLSchema({ type: Animal }).schemas;

			should(Object.keys(schemas)).be.deepEqual(['Cat', 'Human', 'Animal']);
			const types = schemas.Animal.getTypes();
			should(types[0].name).be.equal('Cat')
			should(types[1].name).be.equal('Human')
			should(types).have.length(2);
			should(schemas.Animal).be.instanceOf(GraphQLUnionType);
		});

		it('if transformMetadata is supplied, it should transform the metadata', () => {
			class Customer {
				@field()
				firstname: string;
			}

			const transformMetadata = (metadata, { type: t, parentType }) => {
				const type = _fp.get('opts.type', metadata) || t;

				if (type === String && parentType.name !== 'Query') {
					class Query {
						@field()
						EQ: string;
					}
					return _fp.set('opts.type', Query, metadata);
				}

				return metadata;
			};

			const schemas: any = generateGQLSchema({ type: Customer, transformMetadata }).schemas;
			const fields = schemas.Customer.getFields();
			should(fields.firstname.type).be.instanceOf(GraphQLObjectType);
			should(fields.firstname.type.getFields()).have.property('EQ');
		});
	});
});
