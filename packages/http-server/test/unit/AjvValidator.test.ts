/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { entity, EntityRegistry } from '@davinci/core';
import { createSandbox } from 'sinon';
import { expect } from '../support/chai';
import { AjvValidator, AjvValidatorOptions, createAjvValidator, ParameterConfiguration, Route } from '../../src';
import Ajv, { Options } from 'ajv';

const toPromise = async (fn: Function) => fn();

const sinon = createSandbox();

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
		otherAddresses: Address[];

		@entity.prop()
		home: Address;

		@entity.prop()
		birth: Birth;
	}

	@entity()
	class PayingCustomer extends Customer {
		@entity.prop()
		creditCard: string;
	}

	const initAjvValidator = (
		additionalParameterConfigurations?: ParameterConfiguration<any>[],
		options: Partial<AjvValidatorOptions> = {}
	) => {
		const entityRegistry = new EntityRegistry();
		const ajvValidator = new AjvValidator(options, entityRegistry);

		const parametersConfig: ParameterConfiguration<any>[] = [
			{ name: 'customerId', source: 'path', type: Number },
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
			{ name: 'accountId', source: 'header', type: Number, value: '1000' },
			{
				name: 'payingCustomerArray',
				source: 'query',
				type: [PayingCustomer],
				options: { in: 'query', required: true },
				value: [{ firstname: 'John' }]
			},
			{ source: 'request', value: {} },
			...(additionalParameterConfigurations ?? [])
		];

		return { ajvValidator, parametersConfig };
	};

	afterEach(() => {
		sinon.restore();
	});

	describe('#createSchema', () => {
		it('should create the schema for an endpoint', async () => {
			const { ajvValidator, parametersConfig } = initAjvValidator();
			const schema = await ajvValidator.createSchema(parametersConfig);
			const ajvInstance = ajvValidator.getAjvInstances().body;
			const { schema: customerSchema } = ajvInstance.getSchema('Customer');
			const { schema: birthSchema } = ajvInstance.getSchema('Birth');
			const { schema: addressSchema } = ajvInstance.getSchema('Address');
			const { schema: payingCustomerSchema } = ajvInstance.getSchema('PayingCustomer');

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
							},
							payingCustomerArray: {
								items: {
									$ref: 'PayingCustomer'
								},
								type: 'array'
							}
						},
						required: ['houseNumber', 'customerArray', 'payingCustomerArray']
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
					home: {
						$ref: 'Address'
					},
					otherAddresses: {
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
			expect(payingCustomerSchema).to.be.deep.equal({
				$id: 'PayingCustomer',
				title: 'PayingCustomer',
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
					home: {
						$ref: 'Address'
					},
					otherAddresses: {
						type: 'array',
						items: {
							$ref: 'Address'
						}
					},
					birth: {
						$ref: 'Birth'
					},
					creditCard: {
						type: 'string'
					}
				},
				required: ['lastname']
			});
		});
	});

	describe('#createValidatorFunction', () => {
		it('should create a validator function that succeed', async () => {
			const { ajvValidator, parametersConfig } = initAjvValidator();

			const validatorFunction = await ajvValidator.createValidatorFunction({
				parametersConfig,
				path: '/',
				verb: 'get',
				methodReflection: {} as any,
				controllerReflection: {} as any
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
					],
					payingCustomerArray: [
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
					],
					payingCustomerArray: [
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
				parametersConfig,
				path: '/',
				verb: 'get',
				methodReflection: {} as any,
				controllerReflection: {} as any
			});

			const invalidData = {
				params: { customerId: 'aaa' },
				body: {
					firstname: 'Larry'
				},
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

			const promise = toPromise(() => validatorFunction(invalidData));
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
						schemaPath: '#/params/properties/customerId/type',
						keyword: 'type',
						params: { type: 'number' },
						message: 'must be number'
					},
					{
						instancePath: '/querystring',
						schemaPath: '#/required',
						keyword: 'required',
						params: { missingProperty: 'payingCustomerArray' },
						message: "must have required property 'payingCustomerArray'"
					},
					{
						instancePath: '/querystring/customerArray/0',
						schemaPath: '#/required',
						keyword: 'required',
						params: { missingProperty: 'lastname' },
						message: "must have required property 'lastname'"
					},
					{
						instancePath: '/body',
						schemaPath: '#/required',
						keyword: 'required',
						params: { missingProperty: 'lastname' },
						message: "must have required property 'lastname'"
					}
				]
			});
		});

		it('should skip parameter validation, if specified', async () => {
			const { ajvValidator, parametersConfig } = initAjvValidator([
				{
					name: 'shouldNotValidate',
					source: 'query',
					type: Number,
					options: { in: 'query', validation: { disabled: true } }
				}
			]);

			const validatorFunction = await ajvValidator.createValidatorFunction({
				parametersConfig,
				path: '/',
				verb: 'get',
				methodReflection: {} as any,
				controllerReflection: {} as any
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
					],
					payingCustomerArray: [
						{
							lastname: 'Bird'
						}
					],
					shouldNotValidate: 'wrong' // should be number
				},
				headers: {
					accountId: '1000'
				}
			};

			const promise = validatorFunction(validData);
			await expect(promise).to.be.fulfilled;
			expect(validData).to.be.containSubset({
				querystring: {
					shouldNotValidate: 'wrong'
				}
			});
		});

		it('should validates using the different Ajv instances passed as parameters', async () => {
			const pathAjvOptions = { coerceTypes: true };
			const headerAjvOptions: Options = { removeAdditional: 'all' };
			const queryAjvOptions = { removeAdditional: false, coerceTypes: true };
			const bodyAjvOptions = { removeAdditional: false, coerceTypes: false };

			const { ajvValidator, parametersConfig } = initAjvValidator([], {
				ajvOptions: {
					path: pathAjvOptions,
					header: headerAjvOptions,
					query: queryAjvOptions,
					body: bodyAjvOptions
				}
			});

			const validatorFunction = await ajvValidator.createValidatorFunction({
				parametersConfig,
				path: '/',
				verb: 'get',
				methodReflection: {} as any,
				controllerReflection: {} as any
			});

			const invalidData1 = {
				params: { customerId: '4000' },
				body: {
					lastname: 'Bird',
					home: {
						number: 40
					}
				},
				querystring: {
					additionalProp: true,
					street: 'My road',
					houseNumber: '40',
					customerArray: [
						{
							lastname: 'Bird'
						}
					],
					payingCustomerArray: [
						{
							lastname: 'Bird'
						}
					]
				},
				headers: {
					additionalHeader: true,
					accountId: 1000
				}
			};

			const promise1 = toPromise(() => validatorFunction(invalidData1));
			const error1 = await promise1.catch(err => err);

			// additionalProps allowed in querystrying
			expect(invalidData1.querystring.additionalProp).to.be.ok;

			// type coercion enabled in params
			expect(invalidData1.params.customerId).to.be.a('number');

			// additionalProps removed in headers
			expect(invalidData1.headers.additionalHeader).to.be.undefined;

			// type coercion disabled in body
			expect(error1).to.containSubset({
				errors: [
					{
						instancePath: '/body/home/number',
						schemaPath: 'Address/properties/number/type',
						keyword: 'type',
						params: {
							type: 'string'
						},
						message: 'must be string'
					}
				]
			});
		});
	});

	describe('#createAjvValidator', () => {
		it('should create a validator that uses AjvValidator', async () => {
			const options: AjvValidatorOptions = {
				ajvOptions: { removeAdditional: 'all' }
			};
			const ajvValidatorFactory = createAjvValidator(options);
			const route = {
				path: '/',
				verb: 'get',
				parametersConfig: [
					{ source: 'path', type: Number, name: 'customerId' },
					{ source: 'body', type: Customer, name: 'customerData' }
				]
			} as Route<any>;
			const data = {
				params: {
					customerId: '180123'
				},
				body: {}
			};

			const validator = await ajvValidatorFactory(route);
			const error = await toPromise(() => validator(data)).catch(err => err);

			expect(validator).to.be.a('function');
			expect(data.params.customerId).to.be.equal(180123);
			expect(error).to.containSubset({
				name: 'BadRequest',
				message: 'Validation error',
				statusCode: 400,
				errors: [
					{
						instancePath: '/body',
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

		it('should create AjvValidator given simple options and simple plugins', async () => {
			const plugin1 = sinon.stub();
			const plugin1opts = { opt: 1 };
			const plugin2 = sinon.stub();
			const options: AjvValidatorOptions = {
				ajvOptions: { strict: true, strictNumbers: true },
				ajvPlugins: [[plugin1, plugin1opts], [plugin2]]
			};

			const ajvInstances = new AjvValidator(options).getAjvInstances();

			Object.keys(ajvInstances || {}).forEach(source => {
				expect((ajvInstances?.[source] as Ajv).opts).to.include(options.ajvOptions as Options);
			});

			expect(plugin1.callCount).to.eql(4);
			expect(plugin1.firstCall.args[1]).to.be.deep.equal(plugin1opts);

			expect(plugin2.callCount).to.eql(4);
			expect(plugin2.firstCall.args[1]).to.be.undefined;
		});

		it('should create AjvValidator given simple options and plugins map', async () => {
			const plugin1 = sinon.stub();
			const plugin1opts = { opt: 1 };
			const plugin2 = sinon.stub();
			const options: AjvValidatorOptions = {
				ajvOptions: { strict: true, strictNumbers: true },
				ajvPlugins: {
					path: [[plugin1, plugin1opts]],
					body: [[plugin2]]
				}
			};

			const ajvInstances = new AjvValidator(options).getAjvInstances();

			Object.keys(ajvInstances || {}).forEach(source => {
				expect((ajvInstances?.[source] as Ajv).opts).to.include(options.ajvOptions as Options);
			});

			expect(plugin1.callCount).to.eql(1);
			expect(plugin1.firstCall.args[1]).to.be.deep.equal(plugin1opts);

			expect(plugin2.callCount).to.eql(1);
			expect(plugin2.firstCall.args[1]).to.be.undefined;
		});

		it('should create AjvValidator given options map and simple plugins', async () => {
			const plugin1 = sinon.stub();
			const plugin1opts = { opt: 1 };
			const plugin2 = sinon.stub();
			const options: AjvValidatorOptions = {
				ajvOptions: {
					header: { strict: true, strictNumbers: false },
					path: { coerceTypes: true }
				},
				ajvPlugins: [[plugin1, plugin1opts], [plugin2]]
			};

			const ajvInstances = new AjvValidator(options).getAjvInstances();

			expect(ajvInstances?.body?.opts).to.not.include({
				...options.ajvOptions?.['header'],
				...options.ajvOptions?.['path']
			});
			expect(ajvInstances?.query?.opts).to.not.include({
				...options.ajvOptions?.['header'],
				...options.ajvOptions?.['path']
			});

			expect(ajvInstances?.header?.opts).to.include(options.ajvOptions?.['header']);
			expect(ajvInstances?.header?.opts).to.not.include(options.ajvOptions?.['path']);

			expect(ajvInstances?.path?.opts).to.include(options.ajvOptions?.['path']);
			expect(ajvInstances?.path?.opts).to.not.include(options.ajvOptions?.['header']);

			expect(plugin1.callCount).to.eql(4);
			expect(plugin1.firstCall.args[1]).to.be.deep.equal(plugin1opts);

			expect(plugin2.callCount).to.eql(4);
			expect(plugin2.firstCall.args[1]).to.be.undefined;
		});

		it('should create AjvValidator given options map and plugins map', async () => {
			const plugin1 = sinon.stub();
			const plugin1opts = { opt: 1 };
			const plugin2 = sinon.stub();
			const options: AjvValidatorOptions = {
				ajvOptions: {
					header: { strict: true, strictNumbers: false },
					path: { coerceTypes: true }
				},
				ajvPlugins: {
					path: [[plugin1, plugin1opts]],
					body: [[plugin2]]
				}
			};

			const ajvInstances = new AjvValidator(options).getAjvInstances();

			expect(ajvInstances?.body?.opts).to.not.include({
				...options.ajvOptions?.['header'],
				...options.ajvOptions?.['path']
			});
			expect(ajvInstances?.query?.opts).to.not.include({
				...options.ajvOptions?.['header'],
				...options.ajvOptions?.['path']
			});

			expect(ajvInstances?.header?.opts).to.include(options.ajvOptions?.['header']);
			expect(ajvInstances?.header?.opts).to.not.include(options.ajvOptions?.['path']);

			expect(ajvInstances?.path?.opts).to.include(options.ajvOptions?.['path']);
			expect(ajvInstances?.path?.opts).to.not.include(options.ajvOptions?.['header']);

			expect(plugin1.callCount).to.eql(1);
			expect(plugin1.firstCall.args[0].opts).to.include(options.ajvOptions?.['path']);
			expect(plugin1.firstCall.args[1]).to.be.deep.equal(plugin1opts);

			expect(plugin2.callCount).to.eql(1);
			expect(plugin2.firstCall.args[0].opts).to.not.include(options.ajvOptions?.['path']);
			expect(plugin2.firstCall.args[1]).to.be.undefined;
		});

		it('should create AjvValidator given no options and simple plugins', async () => {
			const plugin1 = sinon.stub();
			const plugin1opts = { opt: 1 };
			const plugin2 = sinon.stub();
			const options: AjvValidatorOptions = {
				ajvPlugins: [[plugin1, plugin1opts], [plugin2]]
			};
			const defaultOptions = {
				removeAdditional: 'all',
				coerceTypes: 'array',
				allErrors: true,
				useDefaults: true
			};

			const ajvInstances = new AjvValidator(options).getAjvInstances();

			Object.keys(ajvInstances || {}).forEach(source => {
				expect((ajvInstances?.[source] as Ajv).opts).to.include(defaultOptions);
			});

			expect(plugin1.callCount).to.eql(4);
			expect(plugin1.firstCall.args[1]).to.be.deep.equal(plugin1opts);

			expect(plugin2.callCount).to.eql(4);
			expect(plugin2.firstCall.args[1]).to.be.undefined;
		});

		it('should create AjvValidator given no options and plugins map', async () => {
			const plugin1 = sinon.stub();
			const plugin1opts = { opt: 1 };
			const plugin2 = sinon.stub();
			const options: AjvValidatorOptions = {
				ajvPlugins: {
					path: [[plugin1, plugin1opts]],
					body: [[plugin2]],
					header: [[plugin2]]
				}
			};
			const defaultOptions = {
				removeAdditional: 'all',
				coerceTypes: 'array',
				allErrors: true,
				useDefaults: true
			};

			const ajvInstances = new AjvValidator(options).getAjvInstances();

			Object.keys(ajvInstances || {}).forEach(source => {
				expect((ajvInstances?.[source] as Ajv).opts).to.include(defaultOptions);
			});

			expect(plugin1.callCount).to.eql(1);
			expect(plugin1.firstCall.args[1]).to.be.deep.equal(plugin1opts);

			expect(plugin2.callCount).to.eql(2);
			expect(plugin2.firstCall.args[1]).to.be.undefined;
		});

		it('should create AjvValidator given simple options and no plugins', async () => {
			const options: AjvValidatorOptions = {
				ajvOptions: { coerceTypes: true }
			};

			const ajvInstances = new AjvValidator(options).getAjvInstances();

			Object.keys(ajvInstances || {}).forEach(source => {
				expect((ajvInstances?.[source] as Ajv).opts).to.include(options.ajvOptions);
			});
		});

		it('should create AjvValidator given options map and no plugins', async () => {
			const options: AjvValidatorOptions = {
				ajvOptions: {
					header: { strict: true, strictNumbers: false },
					path: { coerceTypes: true }
				}
			};

			const ajvInstances = new AjvValidator(options).getAjvInstances();

			expect(ajvInstances?.body?.opts).to.not.include({
				...options.ajvOptions?.['header'],
				...options.ajvOptions?.['path']
			});
			expect(ajvInstances?.query?.opts).to.not.include({
				...options.ajvOptions?.['header'],
				...options.ajvOptions?.['path']
			});

			expect(ajvInstances?.header?.opts).to.include(options.ajvOptions?.['header']);
			expect(ajvInstances?.header?.opts).to.not.include(options.ajvOptions?.['path']);

			expect(ajvInstances?.path?.opts).to.include(options.ajvOptions?.['path']);
			expect(ajvInstances?.path?.opts).to.not.include(options.ajvOptions?.['header']);
		});

		it('should create AjvValidator given no options and no plugins', async () => {
			const defaultOptions = {
				removeAdditional: 'all',
				coerceTypes: 'array',
				allErrors: true,
				useDefaults: true
			};

			const ajvInstances = new AjvValidator({}).getAjvInstances();

			Object.keys(ajvInstances || {}).forEach(source => {
				expect((ajvInstances?.[source] as Ajv).opts).to.include(defaultOptions);
			});
		});
	});
});
