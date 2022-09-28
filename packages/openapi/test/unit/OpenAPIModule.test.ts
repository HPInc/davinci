/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { App, entity } from '@davinci/core';
import { MethodResponses, route } from '@davinci/http-server';
import { FastifyHttpServer } from '@davinci/http-server-fastify';
import deepMerge from 'deepmerge';
import axios from 'axios';
import { OpenAPIModule, OpenAPIModuleOptions } from '../../src';
import { expect } from '../support/chai';

describe('OpenAPIModule', () => {
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

	const initApp = async (
		openapiModuleOptions?: Partial<OpenAPIModuleOptions>,
		postMethodResponses?: MethodResponses
	) => {
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

		@route.controller({ basePath: '/api/customers' })
		class CustomerController {
			@route.get({ path: '/', description: 'Find all customers' })
			find(@route.query() query: CustomerSearch, @route.query() onlyEnabled: boolean) {
				return { query, onlyEnabled };
			}

			@route.post({ path: '/', description: 'Create customer', responses: { ...postMethodResponses } })
			create(@route.body({ required: true }) data: Customer) {
				return data;
			}

			@route.post({ path: '/multiple', description: 'Create multiple customers' })
			createMany(@route.body({ type: [Customer], required: true }) data: Customer[]) {
				return data;
			}

			@route.patch({ path: '/:id', description: 'Update customer' })
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

	describe('OpenAPI spec generation', () => {
		it('should create the correct paths and parameters definition', async () => {
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
					'/api/customers/multiple': {
						post: {
							description: 'Create multiple customers',
							requestBody: {
								required: true,
								content: {
									'application/json': {
										schema: {
											type: 'array',
											items: {
												$ref: '#/components/schemas/MyCustomer'
											}
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

		it('should create the correct responses definition: ClassType at root level', async () => {
			const { openApiModule } = await initApp(null, { 200: Customer, 201: [Customer] });
			const openAPIDocument = openApiModule.getOpenAPIDocument();

			expect(openAPIDocument.paths['/api/customers'].post.responses).to.be.deep.equal({
				'200': {
					description: 'MyCustomer',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/MyCustomer'
							}
						}
					}
				},
				'201': {
					description: 'MyCustomer',
					content: {
						'application/json': {
							schema: {
								type: 'array',
								items: {
									$ref: '#/components/schemas/MyCustomer'
								}
							}
						}
					}
				}
			});
		});

		it('should create the correct responses definition: ClassType at content level', async () => {
			const { openApiModule } = await initApp(null, {
				200: {
					description: 'Returns the newly created customer',
					headers: { myHeader1: { schema: { type: 'string' } } },
					content: Customer
				},
				201: {
					description: 'Returns the newly created customer',
					headers: { myHeader2: { schema: { type: 'string' } } },
					content: Customer
				}
			});
			const openAPIDocument = openApiModule.getOpenAPIDocument();

			expect(openAPIDocument.paths['/api/customers'].post.responses).to.be.deep.equal({
				'200': {
					description: 'Returns the newly created customer',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/MyCustomer'
							}
						}
					},
					headers: {
						myHeader1: {
							schema: {
								type: 'string'
							}
						}
					}
				},
				'201': {
					description: 'Returns the newly created customer',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/MyCustomer'
							}
						}
					},
					headers: {
						myHeader2: {
							schema: {
								type: 'string'
							}
						}
					}
				}
			});
		});

		it('should create the correct responses definition: ClassType at content type level', async () => {
			const { openApiModule } = await initApp(null, {
				200: {
					description: 'Returns the newly created customer',
					headers: { myHeader1: { schema: { type: 'string' } } },
					content: { 'text/xml': Customer }
				},
				201: {
					description: 'Returns the newly created customer',
					headers: { myHeader2: { schema: { type: 'string' } } },
					content: { 'text/xml': [Customer] }
				}
			});
			const openAPIDocument = openApiModule.getOpenAPIDocument();

			expect(openAPIDocument.paths['/api/customers'].post.responses).to.be.deep.equal({
				'200': {
					description: 'Returns the newly created customer',
					content: {
						'text/xml': {
							schema: {
								$ref: '#/components/schemas/MyCustomer'
							}
						}
					},
					headers: {
						myHeader1: {
							schema: {
								type: 'string'
							}
						}
					}
				},
				'201': {
					description: 'Returns the newly created customer',
					content: {
						'text/xml': {
							schema: {
								type: 'array',
								items: {
									$ref: '#/components/schemas/MyCustomer'
								}
							}
						}
					},
					headers: {
						myHeader2: {
							schema: {
								type: 'string'
							}
						}
					}
				}
			});
		});

		it('should create the correct responses definition: ClassType at schema level', async () => {
			const { openApiModule } = await initApp(null, {
				200: {
					description: 'Returns the newly created customer',
					headers: {
						myHeader1: {
							schema: {
								type: 'string'
							}
						}
					},
					content: { 'text/xml': { schema: Customer, example: { firstname: 'John' } } }
				},
				201: {
					description: 'Returns the newly created customer',
					headers: {
						myHeader2: {
							schema: {
								type: 'string'
							}
						}
					},
					content: { 'text/xml': { schema: [Customer], example: [{ firstname: 'John' }] } }
				}
			});
			const openAPIDocument = openApiModule.getOpenAPIDocument();

			expect(openAPIDocument.paths['/api/customers'].post.responses).to.be.deep.equal({
				'200': {
					description: 'Returns the newly created customer',
					content: {
						'text/xml': {
							schema: {
								$ref: '#/components/schemas/MyCustomer'
							},
							example: { firstname: 'John' }
						}
					},
					headers: {
						myHeader1: {
							schema: {
								type: 'string'
							}
						}
					}
				},
				'201': {
					description: 'Returns the newly created customer',
					content: {
						'text/xml': {
							schema: {
								type: 'array',
								items: {
									$ref: '#/components/schemas/MyCustomer'
								}
							},
							example: [{ firstname: 'John' }]
						}
					},
					headers: {
						myHeader2: {
							schema: {
								type: 'string'
							}
						}
					}
				}
			});
		});

		it('should create the correct responses definition: object', async () => {
			const { openApiModule } = await initApp(null, {
				200: {
					description: 'Returns the newly created customer',
					headers: {
						myHeader1: {
							schema: {
								type: 'string'
							}
						}
					},
					content: {
						'text/xml': {
							schema: {
								type: 'object',
								properties: { firstname: { type: 'string' }, lastname: { type: 'string' } }
							},
							example: { firstname: 'John' }
						}
					}
				},
				201: {
					description: 'Returns the newly created customer',
					headers: {
						myHeader2: {
							schema: {
								type: 'string'
							}
						}
					},
					content: {
						'text/xml': {
							schema: {
								type: 'array',
								items: {
									type: 'object',
									properties: { firstname: { type: 'string' }, lastname: { type: 'string' } }
								}
							},
							example: [{ firstname: 'John' }]
						}
					}
				}
			});
			const openAPIDocument = openApiModule.getOpenAPIDocument();

			expect(openAPIDocument.paths['/api/customers'].post.responses).to.be.deep.equal({
				'200': {
					description: 'Returns the newly created customer',
					content: {
						'text/xml': {
							schema: {
								type: 'object',
								properties: {
									firstname: {
										type: 'string'
									},
									lastname: {
										type: 'string'
									}
								}
							},
							example: { firstname: 'John' }
						}
					},
					headers: {
						myHeader1: {
							schema: {
								type: 'string'
							}
						}
					}
				},
				'201': {
					description: 'Returns the newly created customer',
					content: {
						'text/xml': {
							schema: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										firstname: {
											type: 'string'
										},
										lastname: {
											type: 'string'
										}
									}
								}
							},
							example: [{ firstname: 'John' }]
						}
					},
					headers: {
						myHeader2: {
							schema: {
								type: 'string'
							}
						}
					}
				}
			});
		});

		it('should create the correct responses definition from primitive types', async () => {
			const { openApiModule } = await initApp(null, { 200: String, 201: [Date] });
			const openAPIDocument = openApiModule.getOpenAPIDocument();

			expect(openAPIDocument.paths['/api/customers'].post.responses).to.be.deep.equal({
				'200': {
					description: '',
					content: {
						'application/json': {
							schema: {
								type: 'string'
							}
						}
					}
				},
				'201': {
					description: '',
					content: {
						'application/json': {
							schema: {
								type: 'array',
								items: {
									type: 'string',
									format: 'date-time'
								}
							}
						}
					}
				}
			});
		});
	});

	describe('endpoints', () => {
		it('should expose an endpoint returning the spec', async () => {
			await initApp({ document: { path: '/swagger-doc', spec: { info: { title: '', version: '' } } } });

			const { data } = await axios.get('http://localhost:3000/swagger-doc');

			expect(data).to.have.keys('openapi', 'paths', 'info', 'components', 'security');
		});

		it('should expose an endpoint returning the swagger UI', async () => {
			await initApp({ explorer: { path: '/swagger-ui' } });

			const { data } = await axios.get('http://localhost:3000/swagger-ui');

			expect(data).to.match(/<html.+>(.|\n)+<\/html>/);
		});

		it('should be able to disable the spec endpoint but enable the swagger UI', async () => {
			await initApp({
				document: { spec: { info: { title: '', version: '' } }, enabled: false },
				explorer: { path: '/swagger-ui' }
			});

			const { data } = await axios.get('http://localhost:3000/swagger-ui');

			expect(data).to.match(/<html.+>(.|\n)+<\/html>/);
		});
	});
});
