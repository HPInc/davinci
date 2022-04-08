/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { App } from '@davinci/core';
import should from 'should';
import { HttpServerModule } from '../../src';
import * as http from 'http';

describe('HttpServerModule', () => {
	let app: App;

	beforeEach(() => {
		app = new App();
	});

	afterEach(async () => {
		await app.shutdown().catch(() => {});
	});

	it('should be extended by http server modules', async () => {
		class ExpressHttpServer extends HttpServerModule {
			get() {}
			post() {}
			head() {}
			delete() {}
			put() {}
			patch() {}
			all() {}
			options() {}
			listen() {}
			initHttpServer() {}
			setInstance() {}
			getInstance() {}
			reply() {}
			close() {}
			getRequestHostname() {}
			getRequestParameter() {}
			getRequestMethod() {}
			getRequestUrl() {}
			status() {}
			redirect() {}
			setErrorHandler() {}
			setNotFoundHandler() {}
			setHeader() {}
		}
		const expressHttpServer = new ExpressHttpServer({ port: 1234 });

		should(expressHttpServer.getModuleId()).be.equal('http');
		should(expressHttpServer.getModuleOptions()).be.deepEqual({ port: 1234 });
	});

	it('should be extended by http server modules', async () => {
		class ExpressHttpServer extends HttpServerModule {
			get() {}
			post() {}
			head() {}
			delete() {}
			put() {}
			patch() {}
			all() {}
			options() {}
			listen() {}
			initHttpServer() {}
			setInstance() {}
			getInstance() {}
			reply() {}
			close() {}
			getRequestHostname() {}
			getRequestParameter() {}
			getRequestMethod() {}
			getRequestUrl() {}
			status() {}
			redirect() {}
			setErrorHandler() {}
			setNotFoundHandler() {}
			setHeader() {}
		}
		const expressHttpServer = new ExpressHttpServer({ port: 1234 });

		should(expressHttpServer.getModuleId()).be.equal('http');
		should(expressHttpServer.getModuleOptions()).be.deepEqual({ port: 1234 });
	});

	it('should be able to set and get the underlying http server instance', async () => {
		class ExpressHttpServer extends HttpServerModule {
			get() {}
			post() {}
			head() {}
			delete() {}
			put() {}
			patch() {}
			all() {}
			options() {}
			listen() {}
			initHttpServer() {}
			setInstance() {}
			getInstance() {}
			reply() {}
			close() {}
			getRequestHostname() {}
			getRequestParameter() {}
			getRequestMethod() {}
			getRequestUrl() {}
			status() {}
			redirect() {}
			setErrorHandler() {}
			setNotFoundHandler() {}
			setHeader() {}
		}
		const expressHttpServer = new ExpressHttpServer({ port: 1234 });

		const httpServer = http.createServer(() => {});
		expressHttpServer.setHttpServer(httpServer);

		should(expressHttpServer.getHttpServer()).be.equal(httpServer);
	});
});
