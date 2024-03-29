/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import sinon from 'sinon';
import { entity, EntityDefinition, EntityRegistry, omit, transformEntityDefinitionSchema } from '../../../src';
import { expect } from '../../support/chai';
import { Author } from '../../support/data/AuthorSchema';
import { Book } from '../../support/data/BookSchema';

describe('EntityRegistry', () => {
	it('should be able to add and create json schema for entities', () => {
		const entityRegistry = new EntityRegistry();

		@entity()
		class Birth {
			@entity.prop()
			date: Date;

			@entity.prop()
			country: string;
		}

		@entity()
		class Customer {
			@entity.prop()
			firstname: string;

			@entity.prop({ required: true })
			lastname: string;

			@entity.prop()
			birth: Birth;
		}

		const jsonSchema = entityRegistry.getEntityDefinitionJsonSchema(Customer);
		const entries = Array.from(entityRegistry.getEntityDefinitionMap().entries());

		expect(jsonSchema).to.containSubset({
			title: 'Customer',
			type: 'object',
			properties: {
				firstname: {
					type: 'string'
				},
				lastname: {
					type: 'string'
				}
			},
			required: ['lastname']
		});
		expect(jsonSchema.properties.birth._$ref).to.be.instanceof(EntityDefinition);
		expect(entries[0][0]).to.be.equal(Birth);
		expect(entries[0][1]).to.be.instanceof(EntityDefinition);
		expect(entries[1][0]).to.be.equal(Customer);
		expect(entries[1][1]).to.be.instanceof(EntityDefinition);
	});

	it('should use the entityDefinitionMap cache', () => {
		const entityRegistry = new EntityRegistry();
		const cacheGet = sinon.spy(entityRegistry.getEntityDefinitionMap(), 'get');
		const cacheSet = sinon.spy(entityRegistry.getEntityDefinitionMap(), 'set');

		@entity()
		class Customer {
			@entity.prop()
			firstname: string;

			@entity.prop({ required: true })
			lastname: string;
		}

		entityRegistry.getEntityDefinitionJsonSchema(Customer);
		entityRegistry.getEntityDefinitionJsonSchema(Customer);
		entityRegistry.getEntityDefinitionJsonSchema(Customer);

		expect(cacheGet.callCount).to.be.equal(2);
		expect(cacheSet.callCount).to.be.equal(1);
	});

	it('should be able to generate json schema for primitive type constructors', () => {
		const entityRegistry = new EntityRegistry();

		expect(entityRegistry.getEntityDefinitionJsonSchema(String)).to.be.deep.equal({ type: 'string' });
		expect(entityRegistry.getEntityDefinitionJsonSchema(Number)).to.be.deep.equal({ type: 'number' });
		expect(entityRegistry.getEntityDefinitionJsonSchema(Boolean)).to.be.deep.equal({ type: 'boolean' });
		expect(entityRegistry.getEntityDefinitionJsonSchema(Date)).to.be.deep.equal({
			type: 'string',
			format: 'date-time'
		});
	});

	it('should support recursive types', () => {
		const entityRegistry = new EntityRegistry();

		@entity()
		class Populate {
			@entity.prop()
			populate: Populate;
		}

		const jsonSchema = entityRegistry.getEntityDefinitionJsonSchema(Populate);
		const populateEntityDefinition = entityRegistry.getEntityDefinitionMap().get(Populate);

		expect(jsonSchema).to.containSubset({
			$id: 'Populate',
			title: 'Populate',
			type: 'object',
			properties: {
				populate: {
					_$ref: populateEntityDefinition
				}
			}
		});
	});

	it('should support recursive array schemas', () => {
		const entityRegistry = new EntityRegistry();

		@entity()
		class Populate {
			@entity.prop({ type: [Populate] })
			populate: Array<Populate>;
		}

		const jsonSchema = entityRegistry.getEntityDefinitionJsonSchema(Populate);
		const populateEntityDefinition = entityRegistry.getEntityDefinitionMap().get(Populate);

		expect(jsonSchema).to.containSubset({
			$id: 'Populate',
			title: 'Populate',
			type: 'object',
			properties: {
				populate: {
					type: 'array',
					items: {
						_$ref: populateEntityDefinition
					}
				}
			}
		});
	});

	it('should support recursive schemas, specified in oneOf, allOf or anyOf keywords', () => {
		const entityRegistry = new EntityRegistry();

		@entity()
		class Populate {
			@entity.prop({ type: false, anyOf: [{ type: 'string' }, Populate] })
			populate: string | Populate;
		}

		const jsonSchema = entityRegistry.getEntityDefinitionJsonSchema(Populate);
		const populateEntityDefinition = entityRegistry.getEntityDefinitionMap().get(Populate);

		expect(jsonSchema).to.be.containSubset({
			$id: 'Populate',
			title: 'Populate',
			type: 'object',
			properties: {
				populate: {
					anyOf: [{ type: 'string' }, { _$ref: populateEntityDefinition }]
				}
			}
		});
	});

	it('should support circular schemas', () => {
		const entityRegistry = new EntityRegistry();
		const authorJsonSchema = entityRegistry.getEntityDefinitionJsonSchema(Author);
		const bookJsonSchema = entityRegistry.getEntityDefinitionJsonSchema(Book);
		const authorEntityDefinition = entityRegistry.getEntityDefinitionMap().get(Author);
		const bookEntityDefinition = entityRegistry.getEntityDefinitionMap().get(Book);

		expect(authorJsonSchema).to.be.containSubset({
			$id: 'Author',
			title: 'Author',
			type: 'object',
			properties: {
				name: {
					type: 'string'
				},
				books: {
					type: 'array',
					items: {
						_$ref: bookEntityDefinition
					}
				}
			}
		});
		expect(bookJsonSchema).to.be.containSubset({
			$id: 'Book',
			title: 'Book',
			type: 'object',
			properties: {
				title: {
					type: 'string'
				},
				author: {
					_$ref: authorEntityDefinition
				}
			}
		});
	});

	describe('#entityDefinitionSchemaTransform', () => {
		it('should traverse and allow transforming json schemas structures', () => {
			const entityRegistry = new EntityRegistry();

			@entity()
			class Birth {
				@entity.prop()
				date: Date;

				@entity.prop()
				country: string;
			}

			class Line1 {
				@entity.prop()
				one: string;

				@entity.prop()
				two: string;
			}

			@entity()
			class HomeAddress {
				@entity.prop()
				line1: Line1;

				@entity.prop()
				number: string;
			}

			class OfficeAddress {
				@entity.prop()
				line1: Line1;

				@entity.prop()
				number: string;
			}

			@entity()
			class Customer {
				@entity.prop()
				firstname: string;

				@entity.prop({ required: true })
				lastname: string;

				@entity.prop()
				birth: Birth;

				@entity.prop({ anyOf: [HomeAddress, OfficeAddress] })
				address: HomeAddress | OfficeAddress;
			}

			const entityJsonSchema = entityRegistry.getEntityDefinitionJsonSchema(Customer);

			const result = transformEntityDefinitionSchema(entityJsonSchema, args => {
				if (args.pointerPath === '') {
					return { path: '', value: omit(args.schema, ['properties']) };
				}
				if (args.schema._$ref) {
					const ref: EntityDefinition = args.schema._$ref;
					const childEntityJsonSchema = ref.getEntityDefinitionJsonSchema();
					if (childEntityJsonSchema.$id) {
						return { path: args.pointerPath, value: { $ref: `#/${childEntityJsonSchema.$id}` } };
					}
					return { path: args.pointerPath, value: childEntityJsonSchema };
				}
				if (typeof args.schema === 'function') {
					const childEntityJsonSchema = entityRegistry.getEntityDefinitionJsonSchema(args.schema);
					if (childEntityJsonSchema.$id) {
						return { path: args.pointerPath, value: { $ref: `#/${childEntityJsonSchema.$id}` } };
					}
					return { path: args.pointerPath, value: childEntityJsonSchema };
				}
				if (args.parentKeyword === 'properties') {
					return { path: args.pointerPath, value: args.schema };
				}

				return null;
			});

			expect(result).to.containSubset({
				title: 'Customer',
				type: 'object',
				required: ['lastname'],
				$id: 'Customer',
				properties: {
					firstname: {
						type: 'string'
					},
					lastname: {
						type: 'string'
					},
					birth: {
						$ref: '#/Birth'
					},
					address: {
						anyOf: [
							{
								$ref: '#/HomeAddress'
							},
							{
								title: 'OfficeAddress',
								type: 'object',
								properties: {
									line1: {
										title: 'line1',
										type: 'object',
										properties: {
											one: {
												type: 'string'
											},
											two: {
												type: 'string'
											}
										},
										required: []
									},
									number: {
										type: 'string'
									}
								},
								required: []
							}
						],
						title: 'address',
						type: 'object'
					}
				}
			});
		});
	});
});
