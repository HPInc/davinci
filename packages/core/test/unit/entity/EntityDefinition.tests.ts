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

	it('should reflect a class with enum and generate a json schema', () => {
		enum PHONE_TYPE {
			PERSONAL = 'personal',
			WORK = 'work',
			OTHER = 'other',
		}

		enum PHONE_PREFIX {
			one = 1,
			three = 3
		}

		enum PHONE_EXTENSION {
			central,
			ext1
		}
		
		@entity()
		class Phone {
			@entity.prop({ default: PHONE_TYPE.OTHER, enum: PHONE_TYPE })
			stringEnumType: PHONE_TYPE;

			@entity.prop({ enum: PHONE_TYPE })
			stringEnumStringType: string;

			@entity.prop({ enum: PHONE_PREFIX })
			numberEnumType: PHONE_PREFIX;

			@entity.prop({ enum: PHONE_PREFIX })
			numberEnumNumberType: number;

			@entity.prop({ enum: PHONE_EXTENSION })
			symbolEnumType: PHONE_EXTENSION;

			@entity.prop({ enum: PHONE_EXTENSION })
			symbolEnumStringType: string;

			@entity.prop({ enum: PHONE_EXTENSION })
			symbolEnumNumberType: number;

			@entity.prop({ oneOf: [{ enum: PHONE_TYPE }, { enum: PHONE_PREFIX }] })
			typeOrPrefix: PHONE_TYPE | PHONE_PREFIX;

			@entity.prop({
				properties: {
					prefix: {
						enum: PHONE_PREFIX,
						type: 'number'
					},
					complexPrefix: {
						oneOf: [{ enum: PHONE_PREFIX }, { enum: PHONE_TYPE }]
					},
					extension: {
						enum: PHONE_EXTENSION,
						type: PHONE_EXTENSION
					}
				}
			})
			other: Record<string, any>
		}

		const entityDefinition = new EntityDefinition({ type: Phone });

		expect(entityDefinition.getEntityDefinitionJsonSchema()).to.containSubset({
			title: 'Phone',
			type: 'object',
			properties: {
				typeOrPrefix: {
					oneOf: [{ enum: ['personal', 'work', 'other'], type: 'string' }, { enum: ['one', 'three'], type: 'string' }],
					type: 'object'
				},
				numberEnumNumberType: {
					enum: [1, 3],
					type: 'number'
				},
				numberEnumType: {
					enum: [1, 3],
					type: 'number'
				},
				stringEnumType: {
					default: 'other',
					enum: ['personal', 'work', 'other'],
					type: 'string'
				},
				stringEnumStringType: {
					enum: ['personal', 'work', 'other'],
					type: 'string'
				},
				symbolEnumType: {
					enum: [0, 1],
					type: 'number'
				},
				symbolEnumNumberType: {
					enum: [0, 1],
					type: 'number'
				},
				symbolEnumStringType: {
					enum: ['central', 'ext1'],
					type: 'string'
				},
				other: {
					type: 'object',
					properties: {
						prefix: {
							type: 'number',
							enum: [1, 3]
						},
						complexPrefix: {
							oneOf: [
								{ enum: ['personal', 'work', 'other'], type: 'string' },
								{ enum: ['one', 'three'], type: 'string' }
							]
						},
						extension: {
							enum: ['central', 'ext1'],
							type: 'string'
						}
					}
				}
			}
		});
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


	it('should reflect a class and generate a json schema with nested required properties', () => {
		@entity()
		class Customer {
			@entity.prop({ 
				required: ['firstName', 'lastName'], 
				properties: {
					firstName: { type: 'string' },
					middleName: { type: 'string' },
					lastName: { type: 'string' },
					birthday: {
						type: 'object',
						properties: {
							day: { type: 'number' },
							month: { oneOf: ['number', 'string'] },
							year: { type: 'number' }
						},
						required: ['day', 'month']
					}
				}
			})
			personalInfo: Record<string, string>;

			@entity.prop({ required: true })
			id: number;

			@entity.prop({ required: true })
			country: string;

			@entity.prop({
				properties: {
					id: {
						type: 'number'
					},
					firstName: {
						type: 'string'
					},
					lastName: {
						type: 'string'
					}
				},
				anyOf: [{ required: ['id'] }, { required: ['firstName'] }, { required: ['lastName'] }]
			})
			$sort?: Record<'id' | 'firstName' | 'lastName', -1 | 1>;
		}

		const entityDefinition = new EntityDefinition({ type: Customer });

		expect(entityDefinition.getEntityDefinitionJsonSchema()).to.containSubset({
			title: 'Customer',
			type: 'object',
			required: ['id', 'country'],
			properties: {
				id: {
					type: 'number'
				},
				country: {
					type: 'string'
				},
				personalInfo: {
					type: 'object',
					properties: {
						firstName: {
							type: 'string'
						},
						middleName: {
							type: 'string'
						},
						lastName: {
							type: 'string'
						},
						birthday: {
							type: 'object',
							properties: {
								day: {
									type: 'number'
								},
								month: {
									oneOf: ['number', 'string']
								},
								year: {
									type: 'number'
								}
							},
							required: ['day', 'month']
						}
					},
					required: ['firstName', 'lastName']
				},
				$sort: {
					anyOf: [
						{ required: ['id'] },
						{ required: ['firstName'] },
						{ required: ['lastName'] }
					]
				}
			}
		});
	});

	it('should correctly traverse and reflect class types nested in keywords (anyOf, oneOf, allOf)', () => {
		class HomeAddress {
			@entity.prop()
			line1: string;

			@entity.prop()
			number: string;
		}

		@entity()
		class OfficeAddress {
			@entity.prop()
			line1: string;

			@entity.prop()
			number: string;
		}

		@entity()
		class FamilyAddressNested {
			@entity.prop()
			line1: string;

			@entity.prop()
			number: string;
		}

		@entity()
		class Customer {
			@entity.prop({
				anyOf: [
					HomeAddress,
					OfficeAddress,
					{
						type: 'object',
						properties: { nested: FamilyAddressNested, otherProp: { type: 'string' } },
						required: ['nested']
					}
				]
			})
			address: HomeAddress | OfficeAddress;
		}

		const entityDefinition = new EntityDefinition({ type: Customer });
		const entityDefinitionJsonSchema = entityDefinition.getEntityDefinitionJsonSchema();

		expect(entityDefinitionJsonSchema).to.containSubset({
			$id: 'Customer',
			title: 'Customer',
			type: 'object',
			properties: {
				address: {
					anyOf: [
						{
							title: 'HomeAddress',
							type: 'object',
							properties: {
								line1: {
									type: 'string'
								},
								number: {
									type: 'string'
								}
							},
							required: []
						},
						{},
						{
							type: 'object',
							properties: {
								nested: {},
								otherProp: {
									type: 'string'
								}
							},
							required: ['nested']
						}
					],
					title: 'address',
					type: 'object'
				}
			},
			required: []
		});
		expect(entityDefinitionJsonSchema.properties.address.anyOf[1])
			.to.haveOwnProperty('_$ref')
			.to.be.instanceof(EntityDefinition);
		expect(entityDefinitionJsonSchema.properties.address.anyOf[2].properties.nested)
			.to.haveOwnProperty('_$ref')
			.to.be.instanceof(EntityDefinition);
	});

	it('should disable the type detection, if type is set to "false"', () => {
		@entity()
		class Customer {
			@entity.prop({
				type: false,
				anyOf: [
					{
						type: 'number'
					},
					{
						type: 'string'
					}
				]
			})
			address: number | string;

			@entity.prop({
				type: null,
				anyOf: [
					{
						type: 'number'
					},
					{
						type: 'string'
					}
				]
			})
			number: number | string;
		}

		const entityDefinition = new EntityDefinition({ type: Customer });
		const entityDefinitionJsonSchema = entityDefinition.getEntityDefinitionJsonSchema();

		expect(entityDefinitionJsonSchema).to.containSubset({
			$id: 'Customer',
			title: 'Customer',
			properties: {
				address: {
					anyOf: [{ type: 'number' }, { type: 'string' }]
				},
				number: {
					anyOf: [{ type: 'number' }, { type: 'string' }]
				}
			},
			required: []
		});
		expect(entityDefinitionJsonSchema.properties.address.type).to.be.undefined;
		expect(entityDefinitionJsonSchema.properties.number.type).to.be.undefined;
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
