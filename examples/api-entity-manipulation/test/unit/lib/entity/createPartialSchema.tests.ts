/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { entity, EntityRegistry } from '@davinci/core';
import { createPartialSchema } from '../../../../src/lib/entity/createPartialSchema';
import { expect } from '../../../support/chai';

describe('createPartialSchema', () => {
	let entityRegistry: EntityRegistry;

	beforeEach(() => {
		entityRegistry = new EntityRegistry();
	});

	it('should create an entityJsonSchema stripping out all the required flags', () => {
		class Customer {
			@entity.prop({ required: true })
			firstname: string;

			@entity.prop({ required: true })
			lastname: string;
		}

		class CustomerPartial extends createPartialSchema(Customer) {}

		const jsonSchema = entityRegistry.getEntityDefinitionJsonSchema(CustomerPartial);

		expect(jsonSchema).to.be.deep.equal({
			title: 'CustomerPartial',
			type: 'object',
			properties: {
				firstname: {
					type: 'string'
				},
				lastname: {
					type: 'string'
				}
			},
			required: []
		});
	});

	it('should work with nested types', () => {
		class Phone {
			@entity.prop({ required: true })
			number: string;
		}

		class Customer {
			@entity.prop({ required: true })
			firstname: string;

			@entity.prop({ required: true })
			lastname: string;

			@entity.prop({ required: true })
			phone: Phone;
		}

		class CustomerPartial extends createPartialSchema(Customer) {}

		const jsonSchema = entityRegistry.getEntityDefinitionJsonSchema(CustomerPartial);

		expect(jsonSchema).to.be.deep.equal({
			title: 'CustomerPartial',
			type: 'object',
			properties: {
				firstname: {
					type: 'string'
				},
				lastname: {
					type: 'string'
				},
				phone: {
					title: 'phone',
					type: 'object',
					properties: {
						number: {
							type: 'string'
						}
					},
					required: []
				}
			},
			required: []
		});
	});

	it('should work with nested entities', () => {
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

		class CustomerPartial extends createPartialSchema(Customer) {}

		const jsonSchema = entityRegistry.getEntityDefinitionJsonSchema(CustomerPartial);

		expect(jsonSchema).to.be.deep.equal({
			title: 'CustomerPartial',
			type: 'object',
			properties: {
				firstname: {
					type: 'string'
				},
				lastname: {
					type: 'string'
				},
				phone: {
					title: 'phone',
					type: 'object',
					properties: {
						number: {
							type: 'string'
						}
					},
					required: []
				}
			},
			required: []
		});
	});
});
