/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import sinon from 'sinon';
import { entity, EntityDefinition, EntityRegistry, omit } from '../../../src';
import { expect } from '../../support/chai';

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

	it('should be able to generate json schema for primitive type contructors', () => {
		const entityRegistry = new EntityRegistry();

		expect(entityRegistry.getEntityDefinitionJsonSchema(String)).to.be.deep.equal({ type: 'string' });
		expect(entityRegistry.getEntityDefinitionJsonSchema(Number)).to.be.deep.equal({ type: 'number' });
		expect(entityRegistry.getEntityDefinitionJsonSchema(Boolean)).to.be.deep.equal({ type: 'boolean' });
		expect(entityRegistry.getEntityDefinitionJsonSchema(Date)).to.be.deep.equal({
			type: 'string',
			format: 'date-time'
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

			let result = entityRegistry.transformEntityDefinitionSchema(entityJsonSchema, args => {
				if (args.pointerPath === '') {
					return { path: '', value: omit(args.schema, ['properties']) };
				} else if (args.schema._$ref) {
					const ref: EntityDefinition = args.schema._$ref;
					const childEntityJsonSchema = ref.getEntityDefinitionJsonSchema();
					if (childEntityJsonSchema.$id) {
						return { path: args.pointerPath, value: { $ref: `#/${childEntityJsonSchema.$id}` } };
					} else {
						return { path: args.pointerPath, value: childEntityJsonSchema };
					}
				} else if (typeof args.schema === 'function') {
					const childEntityJsonSchema = entityRegistry.getEntityDefinitionJsonSchema(args.schema);
					if (childEntityJsonSchema.$id) {
						return { path: args.pointerPath, value: { $ref: `#/${childEntityJsonSchema.$id}` } };
					} else {
						return { path: args.pointerPath, value: childEntityJsonSchema };
					}
				} else if (args.parentKeyword === 'properties') {
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
