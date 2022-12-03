/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { entity, EntityDefinition } from '../../../src';
import { expect } from '../../support/chai';

const sinon = require('sinon').createSandbox();

describe('EntityDefinition', () => {
	afterEach(() => {
		sinon.restore();
	});

	it('should reflect a class and generate a json schema', () => {
		class Phone {
			@entity.prop()
			isDefault: boolean;

			@entity.prop({ type: 'string', required: true })
			phone: number;
		}

		@entity()
		class Birth {
			@entity.prop() // example of type override
			date: Date;

			@entity.prop()
			country: string;
		}

		@entity()
		class Customer {
			@entity.prop({ minLength: 2 })
			firstname: string;

			@entity.prop({ required: true, minLength: 2 })
			lastname: string;

			@entity.prop({ type: [Phone] })
			phones: Phone[];

			@entity.prop()
			birth: Birth;
		}

		const entityDefinition = new EntityDefinition({ type: Customer });

		expect(entityDefinition.getEntityDefinitionJsonSchema()).to.containSubset({
			title: 'Customer',
			type: 'object',
			properties: {
				firstname: {
					type: 'string',
					minLength: 2
				},
				lastname: {
					type: 'string',
					minLength: 2
				},
				phones: {
					type: 'array',
					items: {
						title: 'phones',
						type: 'object',
						properties: {
							isDefault: {
								type: 'boolean'
							},
							phone: {
								type: 'string'
							}
						},
						required: ['phone']
					}
				}
			},
			required: ['lastname']
		});
		expect(entityDefinition.getEntityDefinitionJsonSchema().properties)
			.to.haveOwnProperty('birth')
			.to.haveOwnProperty('_$ref')
			.to.be.instanceof(EntityDefinition);
	});

	it('should reflect a class and generate a json schema using the entity definition cache', () => {
		@entity()
		class Birth {
			@entity.prop()
			date: Date;

			@entity.prop()
			country: string;
		}

		const birthEntityDefinition = new EntityDefinition({ type: Birth });

		@entity()
		class Customer {
			@entity.prop()
			firstname: string;

			@entity.prop({ required: true })
			lastname: string;

			@entity.prop()
			birth: Birth;
		}

		const entityDefinitionsMapCache = new Map([[Birth, birthEntityDefinition]]);
		const entityDefinitionsMapCacheGetSpy = sinon.spy(entityDefinitionsMapCache, 'get');
		const customerEntityDefinition = new EntityDefinition({
			type: Customer,
			entityDefinitionsMapCache
		});

		expect(customerEntityDefinition.getEntityDefinitionJsonSchema()).to.containSubset({
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
		expect(customerEntityDefinition.getEntityDefinitionJsonSchema().properties)
			.to.haveOwnProperty('birth')
			.to.haveOwnProperty('_$ref')
			.to.be.instanceof(EntityDefinition);

		// verify cache is being used
		expect(entityDefinitionsMapCacheGetSpy.called).to.be.equal(true);
	});

	describe('getName', () => {
		it('should infer the entity name from the class', () => {
			@entity()
			class Customer {
				@entity.prop({ minLength: 2 })
				firstname: string;

				@entity.prop({ required: true, minLength: 2 })
				lastname: string;
			}

			const entityDefinition = new EntityDefinition({ type: Customer });
			expect(entityDefinition.getName()).to.be.equal('Customer');
		});

		it('should return the name explicitly passed in the decorator', () => {
			@entity({ name: 'MyCustomer' })
			class Customer {
				@entity.prop({ minLength: 2 })
				firstname: string;

				@entity.prop({ required: true, minLength: 2 })
				lastname: string;
			}

			const entityDefinition = new EntityDefinition({ type: Customer });
			expect(entityDefinition.getName()).to.be.equal('MyCustomer');
		});
	});
});
