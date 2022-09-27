/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { entity, EntityRegistry } from '@davinci/core';
import { expect } from '../support/chai';
import { AjvValidator } from '../../src/AjvValidator';
import { ParameterConfiguration } from '../../src';

describe('AjvValidator', () => {
	class Phone {
		@entity.prop()
		isDefault: boolean;

		@entity.prop({ required: true })
		phone: number;
	}

	@entity()
	class Address {
		@entity.prop()
		street: string;

		@entity.prop()
		number: string;
	}

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

		@entity.prop({ type: [Phone] })
		phones: Phone[];

		@entity.prop({ type: [Address] })
		addresses: Address[];

		@entity.prop()
		birth: Birth;
	}

	const initAjvValidator = () => {
		const entityRegistry = new EntityRegistry();
		const ajvValidator = new AjvValidator({}, entityRegistry);

		const parametersConfig: ParameterConfiguration<any>[] = [
			{ name: 'customerId', source: 'path', type: Number, value: { firstname: '4000' } },
			{
				name: 'data',
				source: 'body',
				type: Customer,
				options: { in: 'body', required: true },
				value: { firstname: 'John' }
			},
			{ name: 'street', source: 'query', type: String, value: 'My Road' },
			{
				name: 'houseNumber',
				source: 'query',
				type: String,
				options: { in: 'query', required: true },
				value: '20'
			},
			{
				name: 'customerArray',
				source: 'query',
				type: [Customer],
				options: { in: 'query', required: true },
				value: [{ firstname: 'John' }]
			},
			{ name: 'accountId', source: 'header', type: Number, value: '1000' }
		];

		return { ajvValidator, parametersConfig };
	};

	describe('#createSchema', () => {
		it('should create the schema for an endpoint', async () => {
			const { ajvValidator, parametersConfig } = initAjvValidator();
			const schema = await ajvValidator.createSchema(parametersConfig);
			const { schema: customerSchema } = ajvValidator.getAjvSchema('Customer');
			const { schema: birthSchema } = ajvValidator.getAjvSchema('Birth');
			const { schema: addressSchema } = ajvValidator.getAjvSchema('Address');

			expect(schema).to.be.deep.equal({
				type: 'object',
				properties: {
					params: {
						type: 'object',
						properties: {
							customerId: {
								type: 'number'
							}
						},
						required: []
					},
					body: { $ref: 'Customer' },
					querystring: {
						type: 'object',
						properties: {
							street: {
								type: 'string'
							},
							houseNumber: {
								type: 'string'
							},
							customerArray: {
								items: {
									$ref: 'Customer'
								},
								type: 'array'
							}
						},
						required: ['houseNumber', 'customerArray']
					},
					headers: {
						type: 'object',
						properties: {
							accountId: {
								type: 'number'
							}
						},
						required: []
					}
				},
				required: ['body']
			});
			expect(customerSchema).to.be.deep.equal({
				$id: 'Customer',
				title: 'Customer',
				type: 'object',
				properties: {
					firstname: {
						type: 'string'
					},
					lastname: {
						type: 'string'
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
									type: 'number'
								}
							},
							required: ['phone']
						}
					},
					addresses: {
						type: 'array',
						items: {
							$ref: 'Address'
						}
					},
					birth: {
						$ref: 'Birth'
					}
				},
				required: ['lastname']
			});
			expect(birthSchema).to.be.deep.equal({
				$id: 'Birth',
				title: 'Birth',
				type: 'object',
				properties: {
					date: {
						type: 'string',
						format: 'date-time'
					},
					country: {
						type: 'string'
					}
				},
				required: []
			});
			expect(addressSchema).to.be.deep.equal({
				$id: 'Address',
				title: 'Address',
				type: 'object',
				properties: {
					street: {
						type: 'string'
					},
					number: {
						type: 'string'
					}
				},
				required: []
			});
		});
	});

	describe('#createValidatorFunction', () => {
		it('should create a validator function that succeed', async () => {
			const { ajvValidator, parametersConfig } = initAjvValidator();

			const validatorFunction = await ajvValidator.createValidatorFunction({
				parametersConfig: parametersConfig
			});

			const validData = {
				body: {
					lastname: 'Bird'
				},
				params: { customerId: '4000' },
				querystring: {
					street: 'My road',
					houseNumber: '40',
					customerArray: [
						{
							lastname: 'Bird'
						}
					]
				},
				headers: {
					accountId: '1000'
				}
			};

			await expect(validatorFunction(validData)).to.be.fulfilled;
			expect(validData).to.be.deep.equal({
				body: {
					lastname: 'Bird'
				},
				params: {
					customerId: 4000
				},
				querystring: {
					street: 'My road',
					houseNumber: '40',
					customerArray: [
						{
							lastname: 'Bird'
						}
					]
				},
				headers: {
					accountId: 1000
				}
			});
		});

		it('should create a validator function that fails', async () => {
			const { ajvValidator, parametersConfig } = initAjvValidator();

			const validatorFunction = await ajvValidator.createValidatorFunction({
				parametersConfig: parametersConfig
			});

			const invalidData = {
				body: {
					firstname: 'Larry'
				},
				params: { customerId: 'aaa' },
				querystring: {
					street: 'My road',
					houseNumber: '40',
					customerArray: [
						{
							firstname: 'Bird'
						}
					]
				},
				headers: {
					accountId: '1000'
				}
			};

			const promise = validatorFunction(invalidData);
			const error = await promise.catch(err => err);
			await expect(promise).to.be.rejected;
			expect(error).to.containSubset({
				name: 'BadRequest',
				message: 'Validation error',
				statusCode: 400,
				className: 'bad-request',
				errors: [
					{
						instancePath: '/params/customerId',
						schemaPath: '#/properties/params/properties/customerId/type',
						keyword: 'type',
						params: {
							type: 'number'
						},
						message: 'must be number'
					},
					{
						instancePath: '/body',
						schemaPath: '#/required',
						keyword: 'required',
						params: {
							missingProperty: 'lastname'
						},
						message: "must have required property 'lastname'"
					},
					{
						instancePath: '/querystring/customerArray/0',
						schemaPath: '#/required',
						keyword: 'required',
						params: {
							missingProperty: 'lastname'
						},
						message: "must have required property 'lastname'"
					}
				]
			});
		});
	});
});
