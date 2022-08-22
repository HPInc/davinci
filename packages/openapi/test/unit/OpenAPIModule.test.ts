/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { App, entity } from '@davinci/core';
import { route } from '@davinci/http-server';
import { FastifyHttpServer } from '@davinci/http-server-fastify';
import { OpenAPIModule } from '../../src';
import { expect } from '../support/chai';

// const sinon = createSandbox();

describe.skip('OpenAPIModule', () => {
	describe('onInit', () => {
		it('should create the correct OpenAPI v3 document', async () => {
			@entity()
			class Phone {
				@entity.prop()
				isDefault: boolean;

				@entity.prop()
				number: number;
			}

			@entity({ name: 'MyCustomer' })
			class Customer {
				@entity.prop({ required: true, minLength: 2 })
				firstname: string;

				@entity.prop({ required: true, minLength: 2 })
				lastname: string;

				@entity.prop()
				age: number;

				@entity.prop({ type: [Phone] })
				phones: Phone[];
			}

			@entity()
			class CustomerSearch extends Customer {}

			@route.controller({ basePath: '/api/customers' })
			class CustomerController {
				@route.get({ path: '/', description: 'Find all customers', responses: { '200': [Customer] } })
				find(@route.query() query: CustomerSearch) {
					return query;
				}

				@route.post({ path: '/', description: 'Create customer', responses: { '200': Customer } })
				create(@route.body({ required: true }) data: Customer) {
					return data;
				}

				@route.patch({ path: '/:id', description: 'Update customer', responses: { '200': Customer } })
				patch(
					@route.path() customerId: string,
					@route.header({ name: 'x-my-header', required: true }) myHeader: string
				) {
					return { customerId, myHeader };
				}
			}
			const openApiModule = new OpenAPIModule({
				document: {
					info: { version: '1.0.0', title: 'Customer API', description: 'My nice Customer API' },
					components: {
						securitySchemes: {
							bearerAuth: {
								type: 'http',
								scheme: 'bearer',
								bearerFormat: 'JWT'
							}
						}
					},
					security: [
						{
							bearerAuth: []
						}
					]
				}
			});
			const app = new App();
			await app.registerController(CustomerController).registerModule(new FastifyHttpServer(), openApiModule);

			await app.init();

			const openAPIDocument = openApiModule.getOpenAPIDocument();

			expect(openAPIDocument).to.be.deep.equal({
				openapi: '3.0.0',
				paths: {
					'/api/customers': {
						get: {
							description: 'Find all customers',
							parameters: [
								{
									name: 'query',
									in: 'query',
									schema: {
										$ref: '#/components/schemas/CustomerSearch'
									}
								}
							]
						},
						post: {
							description: 'Create customer',
							requestBody: {
								required: true,
								content: {
									'application/json': {
										schema: {
											$ref: '#/components/schemas/MyCustomer'
										}
									}
								}
							}
						}
					},
					'/api/customers/:id': {
						patch: {
							description: 'Update customer',
							parameters: [
								{
									name: 'x-my-header',
									in: 'header',
									schema: {
										type: 'string'
									},
									required: true
								}
							]
						}
					}
				},
				info: {
					version: '1.0.0',
					title: 'Customer API',
					description: 'My nice Customer API'
				},
				components: {
					schemas: {
						Phone: {
							$id: 'Phone',
							title: 'Phone',
							type: 'object',
							properties: {
								isDefault: {
									type: 'boolean'
								},
								number: {
									type: 'number'
								}
							},
							required: []
						},
						CustomerSearch: {
							$id: 'CustomerSearch',
							title: 'CustomerSearch',
							type: 'object',
							properties: {
								firstname: {
									minLength: 2,
									type: 'string'
								},
								lastname: {
									minLength: 2,
									type: 'string'
								},
								age: {
									type: 'number'
								},
								phones: {
									type: 'array',
									items: {
										$ref: '#/components/schemas/Phone'
									}
								}
							},
							required: ['firstname', 'lastname']
						},
						MyCustomer: {
							$id: 'MyCustomer',
							title: 'MyCustomer',
							type: 'object',
							properties: {
								firstname: {
									minLength: 2,
									type: 'string'
								},
								lastname: {
									minLength: 2,
									type: 'string'
								},
								age: {
									type: 'number'
								},
								phones: {
									type: 'array',
									items: {
										$ref: '#/components/schemas/Phone'
									}
								}
							},
							required: ['firstname', 'lastname']
						}
					},
					securitySchemes: {
						bearerAuth: {
							type: 'http',
							scheme: 'bearer',
							bearerFormat: 'JWT'
						}
					}
				},
				security: [
					{
						bearerAuth: []
					}
				]
			});
		});
	});
});
