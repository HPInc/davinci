/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { entity, EntityRegistry } from '@davinci/core';
import { createResourceListResponseSchema } from '../../../../src/lib/entity/createResourceListResponseSchema';
import { expect } from '../../../support/chai';

describe('createResourceListResponseSchema', () => {
	let entityRegistry: EntityRegistry;

	beforeEach(() => {
		entityRegistry = new EntityRegistry();
	});

	it('should create an entityJsonSchema that represents the response type of the list endpoint', () => {
		@entity()
		class Phone {
			@entity.prop({ required: true })
			number: string;
		}

		@entity()
		class Customer {
			@entity.prop({ required: true })
			firstname: string;

			@entity.prop({ required: true })
			lastname: string;

			@entity.prop({ required: true })
			phone: Phone;
		}

		class CustomerListResponse extends createResourceListResponseSchema(Customer) {}

		const jsonSchema = entityRegistry.getEntityDefinitionJsonSchema(CustomerListResponse);
		const customerEntityDefinition = entityRegistry.getEntityDefinitionMap().get(Customer);

		expect(jsonSchema).to.be.deep.equal({
			title: 'CustomerListResponse',
			type: 'object',
			properties: {
				data: {
					type: 'array',
					items: {
						_$ref: customerEntityDefinition
					}
				},
				total: {
					type: 'number'
				},
				skip: {
					type: 'number'
				},
				limit: {
					type: 'number'
				}
			},
			required: []
		});
	});
});
