/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { App, entity } from '@davinci/core';
import { route } from '@davinci/http-server';
import { FastifyHttpServer } from '@davinci/http-server-fastify';
import deepMerge from 'deepmerge';
import axios from 'axios';
import { OpenAPIModule, OpenAPIModuleOptions } from '../../src';
import { expect } from '../support/chai';

describe('OpenAPIModule', () => {
	const initApp = async (openapiModuleOptions?: Partial<OpenAPIModuleOptions>) => {
		const openapiModuleOpts = deepMerge(
			{
				document: {
					spec: {
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
				}
			},
			openapiModuleOptions ?? {}
		);

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
			find(@route.query() query: CustomerSearch, @route.query() onlyEnabled: boolean) {
				return { query, onlyEnabled };
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
		const openApiModule = new OpenAPIModule(openapiModuleOpts);
		const app = new App({ logger: { level: 'error' } });
		await app.registerController(CustomerController).registerModule(new FastifyHttpServer(), openApiModule);

		await app.init();

		afterEach(async () => {
			await app.shutdown();
		});

		return { app, openApiModule };
	};

	it('should create the correct OpenAPI v3 document', async () => {
		const { openApiModule } = await initApp();
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
									type: 'object',
									properties: {
										query: { $ref: '#/components/schemas/CustomerSearch' }
									}
								}
							},
							{
								in: 'query',
								name: 'onlyEnabled',
								schema: {
									type: 'boolean'
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
								in: 'path',
								name: 'customerId',
								schema: {
									type: 'string'
								}
							},
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

	it('should expose an endpoint returning the spec', async () => {
		await initApp({ document: { path: '/swagger-doc' } });

		const { data } = await axios.get('http://localhost:3000/swagger-doc');

		expect(data).to.have.keys('openapi', 'paths', 'info', 'components', 'security');
	});

	it('should expose an endpoint returning the swagger UI', async () => {
		await initApp({ explorer: { path: '/swagger-ui' } });

		const { data } = await axios.get('http://localhost:3000/swagger-ui');

		expect(data).to.match(/<html.+>(.|\n)+<\/html>/);
	});

	it('should be able to disable the spec endpoint but enable the swagger UI', async () => {
		await initApp({ document: { enabled: false }, explorer: { path: '/swagger-ui' } });

		const { data } = await axios.get('http://localhost:3000/swagger-ui');

		expect(data).to.match(/<html.+>(.|\n)+<\/html>/);
	});
});
