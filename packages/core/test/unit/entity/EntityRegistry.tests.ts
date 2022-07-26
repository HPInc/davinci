/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { entity, EntityDefinition, EntityRegistry } from '../../../src';
import { expect } from '../../support/chai';

describe('EntityRegistry', () => {
	it('should be able to add create json schema for entities', () => {
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

		const jsonSchema = entityRegistry.getJsonSchema(Customer);
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
		expect(entries[0][0]).to.be.equal(Customer);
		expect(entries[0][1]).to.be.instanceof(EntityDefinition);
		expect(entries[1][0]).to.be.equal(Birth);
		expect(entries[1][1]).to.be.instanceof(EntityDefinition);
	});
});
