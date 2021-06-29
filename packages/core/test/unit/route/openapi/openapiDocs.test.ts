import should from 'should';
import * as openapiDocs from '../../../../src/route/openapi/openapiDocs';

describe('openapiDocs', () => {
	beforeEach(() => {
		// @ts-ignore
		openapiDocs.resources = [];
	});

	it('should add a resource using a swagger document', () => {
		openapiDocs.generateOpenAPIv3({
			info: {
				title: 'API',
				version: '1.0'
			}
		});
	});

	describe('#generateOpenAPIv3', () => {
		it('should generate an OpenAPI doc', () => {
			openapiDocs.addResource(
				{
					definitions: { Customer: { type: 'object' } },
					paths: {
						'/': {
							get: {
								summary: 'This is a summary',
								operationId: 'operationId',
								parameters: [{ name: 'query', in: 'query', schema: { type: 'string' } }],
								responses: {
									'200': {
										description: 'Result'
									}
								}
							}
						}
					}
				},
				'customer'
			);
			const swagger = openapiDocs.generateOpenAPIv3({
				info: { version: '1.0.0', title: 'API' }
			});
			should(swagger).be.match({
				openapi: '3.0.3',
				info: {
					version: '1.0.0',
					title: 'API'
				},
				paths: {
					'/customer': {
						get: {
							summary: 'This is a summary',
							operationId: 'operationId',
							parameters: [
								{
									name: 'query',
									in: 'query',
									schema: {
										type: 'string'
									}
								}
							],
							responses: {
								'200': {
									description: 'Result'
								}
							},
							consumes: ['application/json'],
							produces: ['application/json'],
							tags: ['Customer']
						}
					}
				},
				components: {
					schemas: {
						Customer: {
							type: 'object'
						}
					}
				}
			});
		});

		it('should strip out req, res, context parameters from paths', () => {
			openapiDocs.addResource(
				{
					definitions: { Customer: { type: 'object' } },
					paths: {
						'/': {
							get: {
								summary: 'This is a summary',
								operationId: 'operationId',
								parameters: [
									{ name: 'theQuery', in: 'query', schema: { type: 'string' } },
									{ schema: { type: 'context' } },
									{ schema: { type: 'req' } },
									{ schema: { type: 'res' } },
									{ name: 'theBody', in: 'body', schema: { type: 'object' } }
								],
								responses: {
									'200': {
										description: 'Result'
									}
								}
							}
						}
					}
				},
				'customer'
			);
			const swagger = openapiDocs.generateOpenAPIv3({
				info: { version: '1.0.0', title: 'API' }
			});
			should(swagger.paths['/customer'].get.parameters).have.length(2);
			should(swagger.paths['/customer'].get.parameters).be.deepEqual([
				{ name: 'theQuery', in: 'query', schema: { type: 'string' } },
				{ name: 'theBody', in: 'body', schema: { type: 'object' } }
			]);
		});

		it('should hide an endpoint if "hidden" is set to true', () => {
			openapiDocs.addResource(
				{
					definitions: { Customer: { type: 'object' } },
					paths: {
						'/my/endpoint/one/method': {
							post: {
								summary: 'Create something',
								operationId: 'operationId',
								parameters: [],
								responses: {},
								hidden: true
							}
						},
						'/my/endpoint/two/methods': {
							get: {
								summary: 'This is my endpoint',
								operationId: 'operationId',
								parameters: [
									{ name: 'theQuery', in: 'query', schema: { type: 'string' } },
									{ schema: { type: 'context' } },
									{ schema: { type: 'req' } },
									{ schema: { type: 'res' } },
									{ name: 'theBody', in: 'body', schema: { type: 'object' } }
								],
								responses: {
									'200': {
										description: 'Result'
									}
								}
							},
							post: {
								summary: 'Create something',
								operationId: 'operationId',
								parameters: [],
								responses: {},
								hidden: true
							}
						}
					}
				},
				'customer'
			);
			const swagger = openapiDocs.generateOpenAPIv3({
				info: { version: '1.0.0', title: 'API' }
			});

			// the path '/my/endpoint/one/method' should be removed entirely
			// the path '/my/endpoint/two/methods' should contain just 1 endpoint
			should(swagger.paths).be.deepEqual({
				'/customer/my/endpoint/two/methods': {
					get: {
						summary: 'This is my endpoint',
						operationId: 'operationId',
						parameters: [
							{
								name: 'theQuery',
								in: 'query',
								schema: {
									type: 'string'
								}
							},
							{
								name: 'theBody',
								in: 'body',
								schema: {
									type: 'object'
								}
							}
						],
						responses: {
							'200': {
								description: 'Result'
							}
						},
						consumes: ['application/json'],
						produces: ['application/json'],
						tags: ['Customer']
					}
				}
			});
		});

		it('should hide a definition if "hidden" is set to true', () => {
			openapiDocs.addResource(
				{
					definitions: {
						Customer: { type: 'object', hidden: true },
						Animal: { type: 'object', hidden: false },
						Plant: { type: 'object' }
					}
				},
				'customer'
			);
			const swagger = openapiDocs.generateOpenAPIv3({
				info: { version: '1.0.0', title: 'API' }
			});

			should(swagger.components.schemas).be.deepEqual({
				Animal: {
					type: 'object'
				},
				Plant: {
					type: 'object'
				}
			});
		});
	});
});
