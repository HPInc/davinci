import should from 'should';
import * as openapiDocs from '../../../../src/route/openapi/openapiDocs';

describe('openapiDocs', () => {
	beforeEach(() => {
		// @ts-ignore
		openapiDocs.resources = [];
	});

	it('should add a resource using a swagger document', () => {
		openapiDocs.generateFullSwagger({
			discoveryUrl: '/api-doc.json',
			version: '1.0', // read from package.json
			basePath: '/api'
		});
	});

	it('should add a resource using a swagger document', () => {
		openapiDocs.generateFullSwagger({
			discoveryUrl: '/api-doc.json',
			version: '1.0', // read from package.json
			basePath: '/api',
			protocol: 'https'
		});
	});

	it('should add a resource using a swagger document', () => {
		openapiDocs.generateFullSwagger({
			discoveryUrl: '/api-doc.json',
			version: '1.0', // read from package.json
			basePath: '/api',
			protocol: 'http'
		});
	});

	it('should add a resource using a swagger document', () => {
		openapiDocs.generateFullSwagger({
			discoveryUrl: '/api-doc.json',
			version: '1.0', // read from package.json
			basePath: null,
			protocol: 'https'
		});
	});

	describe('#generateFullSwagger', () => {
		it('should generate a swagger doc', () => {
			openapiDocs.addResource('customer', {
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
			});
			const swagger = openapiDocs.generateFullSwagger({ basePath: '/api', host: 'localhost', protocol: 'http' });
			should(swagger).be.deepEqual({
				swagger: '2.0',
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
				definitions: {
					Customer: {
						type: 'object'
					}
				},
				parameters: {}
			});
		});

		it('should strip out req, res, context parameters from paths', () => {
			openapiDocs.addResource('customer', {
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
			});
			const swagger = openapiDocs.generateFullSwagger({ basePath: '/api', host: 'localhost', protocol: 'http' });
			should(swagger.paths['/customer'].get.parameters).have.length(2);
			should(swagger.paths['/customer'].get.parameters).be.deepEqual([
				{ name: 'theQuery', in: 'query', schema: { type: 'string' } },
				{ name: 'theBody', in: 'body', schema: { type: 'object' } }
			]);
		});
	});
});
