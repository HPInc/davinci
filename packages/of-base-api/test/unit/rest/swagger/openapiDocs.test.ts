import * as openapiDocs from '../../../../src/rest/swagger/openapiDocs';

describe('openapiDocs', () => {
	// const makeDef = () => {};
	const makeApp = done => {
		return {
			// @ts-ignore
			get: (url, middleware) => {
				const req = {
					headers: {
						'X-Forwarded-Protocol': null,
						host: 'localhost'
					},
					get: () => {
						return 'http';
					}
				};
				const res = {
					json: () => {
						done();
					}
				};
				// app.middleware = middleware;
				middleware(req, res);
			}
		};
	};

	it('should add a resource using a swagger document', done => {
		const app = makeApp(done);
		openapiDocs.createApiDocs(app, {
			discoveryUrl: '/api-doc.json',
			version: '1.0', // read from package.json
			basePath: '/api'
		});
	});

	it('should add a resource using a swagger document', done => {
		const app = makeApp(done);
		openapiDocs.createApiDocs(app, {
			discoveryUrl: '/api-doc.json',
			version: '1.0', // read from package.json
			basePath: '/api',
			protocol: 'https'
		});
	});

	it('should add a resource using a swagger document', done => {
		const app = makeApp(done);
		openapiDocs.createApiDocs(app, {
			discoveryUrl: '/api-doc.json',
			version: '1.0', // read from package.json
			basePath: '/api',
			protocol: 'http'
		});
	});

	it('should add a resource using a swagger document', done => {
		const app = makeApp(done);
		openapiDocs.createApiDocs(app, {
			discoveryUrl: '/api-doc.json',
			version: '1.0', // read from package.json
			basePath: null,
			protocol: 'https'
		});
	});
});
