/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { App, entity } from '@davinci/core';
import { ControllerDecoratorOptions, MethodDecoratorOptions, MethodResponses, route } from '@davinci/http-server';
import { FastifyHttpServer } from '@davinci/http-server-fastify';
import { deepmerge as createDeepMerge } from '@fastify/deepmerge';
import axios from 'axios';
import { PartialDeep } from '@davinci/reflector';
import { OpenAPIModule, OpenAPIModuleOptions } from '../../src';
import { expect } from '../support/chai';

const deepMerge = createDeepMerge({ all: true });

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
		postMethodResponses?: MethodResponses,
		controllerDecoratorOptions?: PartialDeep<ControllerDecoratorOptions>,
		findMethodDecoratorOptions?: Partial<MethodDecoratorOptions>
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
		) as OpenAPIModuleOptions;

		@route.controller({ basePath: '/api/customers', ...controllerDecoratorOptions })
		class CustomerController {
			@route.get({ path: '/', description: 'Find all customers', ...findMethodDecoratorOptions })
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
							tags: ['Customer'],
							operationId: 'customerFind',
							parameters: [
								{
									name: 'query',
									in: 'query',
									schema: {
										type: 'object',
										properties: {
											query: {
												$ref: '#/components/schemas/CustomerSearch'
											}
										}
									}
								},
								{
									name: 'onlyEnabled',
									in: 'query',
									schema: {
										type: 'boolean'
									}
								}
							]
						},
						post: {
							description: 'Create customer',
							tags: ['Customer'],
							operationId: 'customerCreate',
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
							tags: ['Customer'],
							operationId: 'customerCreateMany',
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
					'/api/customers/{id}': {
						patch: {
							description: 'Update customer',
							tags: ['Customer'],
							operationId: 'customerPatch',
							parameters: [
								{
									name: 'customerId',
									in: 'path',
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

		it('should use the default responses definitions', async () => {
			const { openApiModule } = await initApp(
				{
					defaults: {
						responses: {
							400: Number,
							500: {
								description: 'Server error',
								content: { 'application/json': { schema: { type: 'string' } } }
							}
						}
					}
				},
				{}
			);
			const openAPIDocument = openApiModule.getOpenAPIDocument();

			expect(openAPIDocument.paths['/api/customers'].post.responses).to.be.deep.equal({
				'400': {
					description: '',
					content: {
						'application/json': {
							schema: {
								type: 'number'
							}
						}
					}
				},
				'500': {
					description: 'Server error',
					content: {
						'application/json': {
							schema: {
								type: 'string'
							}
						}
					}
				}
			});
		});

		it('should use the default responses factory', async () => {
			@entity()
			class GenericError {
				@entity.prop()
				error: true;

				@entity.prop()
				message: string;
			}

			class Error {
				@entity.prop()
				field: string;

				@entity.prop()
				reason: string;
			}
			@entity()
			class ValidationError extends GenericError {
				@entity.prop({ type: [Error] })
				errors: Array<Error>;
			}

			const { openApiModule } = await initApp(
				{
					defaults: {
						responses: route => {
							if (route.methodDecoratorMetadata.verb === 'get') {
								return { default: GenericError };
							}

							if (route.methodDecoratorMetadata.verb === 'post') {
								return { default: ValidationError };
							}

							return null;
						}
					}
				},
				{}
			);
			const openAPIDocument = openApiModule.getOpenAPIDocument();

			expect(openAPIDocument).to.containSubset({
				paths: {
					'/api/customers': {
						get: {
							responses: {
								default: {
									description: 'GenericError',
									content: {
										'application/json': {
											schema: {
												$ref: '#/components/schemas/GenericError'
											}
										}
									}
								}
							}
						},
						post: {
							responses: {
								default: {
									description: 'ValidationError',
									content: {
										'application/json': {
											schema: {
												$ref: '#/components/schemas/ValidationError'
											}
										}
									}
								}
							}
						}
					},
					'/api/customers/multiple': {
						post: {
							responses: {
								default: {
									description: 'ValidationError',
									content: {
										'application/json': {
											schema: {
												$ref: '#/components/schemas/ValidationError'
											}
										}
									}
								}
							}
						}
					}
				},
				components: {
					schemas: {
						GenericError: {
							$id: 'GenericError',
							title: 'GenericError',
							type: 'object',
							properties: {
								error: {
									type: 'boolean'
								},
								message: {
									type: 'string'
								}
							},
							required: []
						},
						ValidationError: {
							$id: 'ValidationError',
							title: 'ValidationError',
							type: 'object',
							properties: {
								errors: {
									type: 'array',
									items: {
										title: 'errors',
										type: 'object',
										properties: {
											field: {
												type: 'string'
											},
											reason: {
												type: 'string'
											}
										},
										required: []
									}
								},
								error: {
									type: 'boolean'
								},
								message: {
									type: 'string'
								}
							},
							required: []
						}
					}
				}
			});
		});

		it('should use the default response content type', async () => {
			const { openApiModule } = await initApp(
				{ defaults: { responseContentType: 'text/xml' } },
				{ 200: Customer, 201: [Customer], 202: { description: '', content: { 'application/json': Customer } } }
			);
			const openAPIDocument = openApiModule.getOpenAPIDocument();

			expect(openAPIDocument.paths['/api/customers'].post.responses).to.be.deep.equal({
				'200': {
					description: 'MyCustomer',
					content: {
						'text/xml': {
							schema: {
								$ref: '#/components/schemas/MyCustomer'
							}
						}
					}
				},
				'201': {
					description: 'MyCustomer',
					content: {
						'text/xml': {
							schema: {
								type: 'array',
								items: {
									$ref: '#/components/schemas/MyCustomer'
								}
							}
						}
					}
				},
				'202': {
					description: '',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/MyCustomer'
							}
						}
					}
				}
			});
		});

		it('should use the operationId passed explicitly in the @route.method() decorator', async () => {
			const { openApiModule } = await initApp({}, {}, {}, { operationId: 'findCustomers' });
			const openAPIDocument = openApiModule.getOpenAPIDocument();

			expect(openAPIDocument).to.containSubset({
				paths: {
					'/api/customers': {
						get: {
							operationId: 'findCustomers'
						}
					}
				}
			});
		});

		it('should generate the operationId using a custom formatter', async () => {
			const { openApiModule } = await initApp({
				document: {
					spec: {},
					operationIdFormatter({ controllerName, methodName }) {
						const methodN = methodName.charAt(0).toLowerCase() + methodName.slice(1);
						const controllerN = (controllerName.charAt(0).toUpperCase() + controllerName.slice(1)).replace(
							/Controller/,
							''
						);
						return `${methodN}${controllerN}`;
					}
				}
			});
			const openAPIDocument = openApiModule.getOpenAPIDocument();

			expect(openAPIDocument).to.containSubset({
				paths: {
					'/api/customers': {
						get: {
							operationId: 'findCustomer'
						}
					}
				}
			});
		});

		it('should use the tags passed explicitly in the @route.controller() decorator', async () => {
			const { openApiModule } = await initApp({}, {}, { tags: ['Customer methods'] });
			const openAPIDocument = openApiModule.getOpenAPIDocument();

			expect(openAPIDocument).to.containSubset({
				paths: {
					'/api/customers': {
						get: {
							tags: ['Customer methods']
						},
						post: {
							tags: ['Customer methods']
						}
					},
					'/api/customers/multiple': {
						post: {
							tags: ['Customer methods']
						}
					},
					'/api/customers/{id}': {
						patch: {
							tags: ['Customer methods']
						}
					}
				}
			});
		});

		it('should hide a specific route from the OpenAPI document, if specified', async () => {
			const { openApiModule } = await initApp({}, {}, {}, { hidden: true });
			const openAPIDocument = openApiModule.getOpenAPIDocument();

			expect(openAPIDocument.paths?.['/api/customers']['post']).to.be.ok;
			expect(openAPIDocument.paths?.['/api/customers']['get']).to.be.undefined;
		});

		it('should generate the paths definition, for methods with no parameters', async () => {
			@route.controller({ basePath: '/api/orders' })
			class OrderController {
				@route.get({ path: '/' })
				findAll() {}
			}

			const openApiModule = new OpenAPIModule({ document: { spec: {} } });
			const app = new App({ logger: { level: 'error' } });
			await app.registerController(OrderController).registerModule(new FastifyHttpServer(), openApiModule);
			await app.init();

			const openAPIDocument = openApiModule.getOpenAPIDocument();
			expect(openAPIDocument.paths?.['/api/orders']['get']).to.be.ok;

			await app.shutdown();
		});
	});

	describe('endpoints', () => {
		it('should expose an endpoint returning the spec', async () => {
			await initApp({ document: { path: '/swagger-doc', spec: { info: { title: '', version: '' } } } });

			const { data } = await axios.get('http://127.0.0.1:3000/swagger-doc');

			expect(data).to.have.keys('openapi', 'paths', 'info', 'components', 'security');
		});

		it('should expose an endpoint returning the swagger UI', async () => {
			await initApp({ explorer: { path: '/swagger-ui' } });

			const { data } = await axios.get('http://127.0.0.1:3000/swagger-ui');

			expect(data).to.match(/<html.+>(.|\n)+<\/html>/);
		});

		it('should be able to disable the spec endpoint but enable the swagger UI', async () => {
			await initApp({
				document: { spec: { info: { title: '', version: '' } }, enabled: false },
				explorer: { path: '/swagger-ui' }
			});

			const { data } = await axios.get('http://127.0.0.1:3000/swagger-ui');

			expect(data).to.match(/<html.+>(.|\n)+<\/html>/);
		});
	});
});
