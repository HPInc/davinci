/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import sinon from 'sinon';
import set from 'lodash.set';
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
		it('should', () => {
			const entityRegistry = new EntityRegistry();

			@entity()
			class Birth {
				@entity.prop()
				date: Date;

				@entity.prop()
				country: string;
			}

			@entity()
			class HomeAddress {
				@entity.prop()
				line1: string;

				@entity.prop()
				number: string;
			}

			class OfficeAddress {
				@entity.prop()
				line1: string;

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

			let obj = {};
			entityRegistry.transformEntityDefinitionSchema(entityJsonSchema, args => {
				if (args.pointerPath === '') {
					obj = omit(args.schema, ['properties']);
				} else if (args.schema._$ref) {
					const ref: EntityDefinition = args.schema._$ref;
					const childEntityJsonSchema = ref.getEntityDefinitionJsonSchema();
					if (childEntityJsonSchema.$id) {
						set(obj, args.pointerPath, { $ref: `#/${childEntityJsonSchema.$id}` });
					} else {
						set(obj, args.pointerPath, childEntityJsonSchema);
					}
				} else if (typeof args.schema === 'function') {
					const childEntityJsonSchema = entityRegistry.getEntityDefinitionJsonSchema(args.schema);
					if (childEntityJsonSchema.$id) {
						set(obj, args.pointerPath, { $ref: `#/${childEntityJsonSchema.$id}` });
					} else {
						set(obj, args.pointerPath, childEntityJsonSchema);
					}
				} else if (args.parentKeyword === 'properties') {
					set(obj, args.pointerPath, args.schema);
				}
			});

			console.log(obj);
		});
	});
});
