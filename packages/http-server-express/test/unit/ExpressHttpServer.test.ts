/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { App } from '@davinci/core';
import { route } from '@davinci/http-server';
import axios from 'axios';
import { createSandbox } from 'sinon';
import { reflect } from '@davinci/reflector';
import { expect } from '../support/chai';
import { ExpressHttpServer } from '../../src';
import express from 'express';

const sinon = createSandbox();

describe('ExpressHttpServer', () => {
	let app: App;

	beforeEach(() => {
		app = new App({ logger: { level: 'silent' } });
	});

	afterEach(async () => {
		await app.shutdown().catch(() => {});
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('lifecycle', () => {
		it('should initialize a listening server', async () => {
			const expressHttpServer = new ExpressHttpServer({ port: 3000 });
			app.registerModule(expressHttpServer);

			await app.init();

			const { error } = await axios
				.get('http://localhost:3000')
				.then(response => ({ error: null, response }))
				.catch(error => ({ error }));

			expect(error.response).to.have.property('status').equal(404);
		});

		it('should shutdown the listening server', async () => {
			const expressHttpServer = new ExpressHttpServer({ port: 3000 });
			app.registerModule(expressHttpServer);

			await app.init();
			await app.shutdown().catch(err => err);

			const { error } = await axios
				.get('http://localhost:3000')
				.then(response => ({ error: null, response }))
				.catch(error => ({ error }));

			expect(error.response).to.be.undefined;
			expect(error.code).be.equal('ECONNREFUSED');
		});
	});

	describe('#createRequestHandler', () => {
		it('should create a request handler for a controller method that succeed', async () => {
			const expressHttpServer = new ExpressHttpServer();
			class MyController {
				@route.get({ path: '/all' })
				getAll(
					@route.path() path: string,
					@route.query() filter: string,
					@route.body() body: object,
					@route.header({ name: 'x-accountid' }) accountId: string,
					@route.response() res,
					@route.request() req
				) {
					return { path, filter, body, accountId, res, req };
				}
			}
			const controller = new MyController();
			const replySpy = sinon.spy(expressHttpServer, 'reply');
			const controllerReflection = reflect(MyController);
			const methodReflection = controllerReflection.methods[0];
			const req = {
				params: { path: 'path' },
				query: { filter: 'myFilter' },
				header: () => 123,
				body: { isBody: true }
			};
			const res = { status: sinon.stub(), send: sinon.stub(), json: sinon.stub() };
			const parametersConfig = await expressHttpServer.createParametersConfigurations({
				controllerReflection,
				methodReflection
			});

			const handler = await expressHttpServer.createRequestHandler(controller, 'getAll', {
				path: '/all',
				verb: 'get',
				parametersConfig,
				controllerReflection,
				methodReflection
			});
			// @ts-ignore
			await handler(req, res);

			expect(res.json.args[0][0]).to.be.deep.equal({
				path: 'path',
				accountId: 123,
				body: {
					isBody: true
				},
				filter: 'myFilter',
				req,
				res
			});
			expect(replySpy.called).to.be.true;
		});

		it('should create a request handler for a controller method that fails', async () => {
			const expressHttpServer = new ExpressHttpServer();
			class MyController {
				@route.get({ path: '/all' })
				getAll(@route.query() filter: string) {
					throw new Error('Invalid');
					return { filter };
				}
			}
			const controller = new MyController();
			const replySpy = sinon.spy(expressHttpServer, 'reply');
			const controllerReflection = reflect(MyController);
			const methodReflection = controllerReflection.methods[0];
			const req = { query: { filter: 'myFilter' } };
			const res = { status: sinon.stub(), send: sinon.stub(), json: sinon.stub() };
			const parametersConfig = await expressHttpServer.createParametersConfigurations({
				controllerReflection,
				methodReflection
			});

			const handler = await expressHttpServer.createRequestHandler(controller, 'getAll', {
				path: '/all',
				verb: 'get',
				parametersConfig,
				controllerReflection,
				methodReflection
			});
			// @ts-ignore
			await handler(req, res);

			expect(res.status.args[0][0]).to.be.equal(500);
			expect(res.json.args[0][0]).to.containSubset({ error: true, message: 'Invalid' });
			expect(replySpy.called).to.be.true;
		});
	});

	describe('#createRoutes', () => {
		it('should walk the controller reflection and register routes in express', async () => {
			class MyController {
				@route.get({ path: '/' })
				getAll(@route.query() filter: string) {
					return { filter };
				}

				@route.patch({ path: '/:id' })
				patch(@route.path() id: string, @route.body() data: object) {
					return { id, data };
				}

				@route.put({ path: '/:id' })
				put(@route.path() id: string, @route.body() data: object) {
					return { id, data };
				}

				@route.post({ path: '/create' })
				create(@route.path() id: string, @route.body() data: object) {
					return { id, data };
				}

				@route.del({ path: '/:id' })
				delete(@route.path() id: string) {
					return { id };
				}

				@route.head({ path: '/' })
				head() {
					return {};
				}

				@route.options({ path: '/' })
				options() {
					return {};
				}
			}

			const expressHttpServer = new ExpressHttpServer();
			app.registerController(MyController);
			app.registerModule(expressHttpServer);
			await app.init();

			const express = expressHttpServer.getInstance();

			expect(express._router.stack[4].route).to.have.property('path').equal('/');
			expect(express._router.stack[4].route).to.have.property('methods').deep.equal({ get: true });
			expect(express._router.stack[5].route).to.have.property('path').equal('/:id');
			expect(express._router.stack[5].route).to.have.property('methods').deep.equal({ patch: true });
			expect(express._router.stack[6].route).to.have.property('path').equal('/:id');
			expect(express._router.stack[6].route).to.have.property('methods').deep.equal({ put: true });
			expect(express._router.stack[7].route).to.have.property('path').equal('/create');
			expect(express._router.stack[7].route).to.have.property('methods').deep.equal({ post: true });
			expect(express._router.stack[8].route).to.have.property('path').equal('/:id');
			expect(express._router.stack[8].route).to.have.property('methods').deep.equal({ delete: true });
			expect(express._router.stack[9].route).to.have.property('path').equal('/');
			expect(express._router.stack[9].route).to.have.property('methods').deep.equal({ head: true });
			expect(express._router.stack[10].route).to.have.property('path').equal('/');
			expect(express._router.stack[10].route).to.have.property('methods').deep.equal({ options: true });
		});
	});

	describe('propagation', () => {
		it('should propagate the calls to the underlying express instance', async () => {
			const expressHttpServer = new ExpressHttpServer({ logger: { level: 'silent' } });
			const expressApp = expressHttpServer.getInstance();
			const expressMocks = {
				listen: sinon.stub(expressApp, 'listen'),
				use: sinon.stub(expressApp, 'use'),
				all: sinon.stub(expressApp, 'all')
			};
			const staticMock = sinon.stub(express, 'static');
			const cb = () => {};

			expressHttpServer.use('/', cb);
			expect(expressMocks.use.firstCall.args).to.be.deep.equal(['/', cb]);
			expressHttpServer.all('/', cb);
			expect(expressMocks.all.firstCall.args).to.be.deep.equal(['/', cb]);
			expressHttpServer.static('/', { redirect: true });
			expect(staticMock.firstCall.args).to.be.deep.equal(['/', { redirect: true }]);
			expressHttpServer.listen();
			expect(expressMocks.listen.firstCall.args).to.be.deep.equal([3000]);
		});

		it('should propagate the calls to the underlying response', async () => {
			const expressHttpServer = new ExpressHttpServer();
			const responseMock = {
				status: sinon.stub(),
				render: sinon.stub(),
				redirect: sinon.stub(),
				set: sinon.stub()
			};

			// @ts-ignore
			expressHttpServer.status(responseMock, 200);
			expect(responseMock.status.firstCall.args).to.be.deep.equal([200]);
			// @ts-ignore
			expressHttpServer.render(responseMock, 'view', {});
			expect(responseMock.render.firstCall.args).to.be.deep.equal(['view', {}]);
			// @ts-ignore
			expressHttpServer.redirect(responseMock, 301, 'http://redirect.url');
			expect(responseMock.redirect.firstCall.args).to.be.deep.equal([301, 'http://redirect.url']);
			// @ts-ignore
			expressHttpServer.setHeader(responseMock, 'x-my-header', '123');
			expect(responseMock.set.firstCall.args).to.be.deep.equal(['x-my-header', '123']);
		});
	});
});
