/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { App } from '@davinci/core';
import { route } from '@davinci/http-server';
import { createSandbox } from 'sinon';
import { reflect } from '@davinci/reflector';
import { expect } from '../support/chai';
import { AgnosticRouter } from '../../src';
import { Router } from 'itty-router';

const sinon = createSandbox();

describe('AgnosticRouter', () => {
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
		it('should initialize a router', async () => {
			const router = Router();
			const agnosticRouterModule = new AgnosticRouter({ app: router });
			app.registerModule(agnosticRouterModule);

			await app.init();

			const { error } = await router
				.handle({ method: 'get', url: 'http://baseurl.com/' })
				.then(response => ({ error: null, response }))
				.catch(error => ({ error }));

			expect(error).to.have.property('statusCode').equal(404);
		});
	});

	describe('#createRequestHandler', () => {
		it('should create a request handler for a controller method that succeed', async () => {
			const agnosticRouterModule = new AgnosticRouter();
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
			const replySpy = sinon.spy(agnosticRouterModule, 'reply');
			const controllerReflection = reflect(MyController);
			const methodReflection = controllerReflection.methods[0];
			const req = {
				params: { path: 'path' },
				query: { filter: 'myFilter' },
				headers: { 'x-accountid': 123 },
				json: () => ({ isBody: true })
			};
			const res = {};
			const parametersConfig = await agnosticRouterModule.createParametersConfigurations({
				controllerReflection,
				methodReflection
			});

			const handler = await agnosticRouterModule.createRequestHandler(controller, 'getAll', {
				path: '/all',
				verb: 'get',
				parametersConfig,
				controllerReflection,
				methodReflection
			});
			// @ts-ignore
			const result = await handler(req, res);

			expect(result).to.containSubset({
				content: {
					path: 'path',
					filter: 'myFilter',
					body: {
						isBody: true
					},
					accountId: 123,
					res: {
						statusCode: 200
					},
					req: {
						params: {
							path: 'path'
						},
						query: {
							filter: 'myFilter'
						},
						headers: {
							'x-accountid': 123
						}
					}
				},
				status: 200,
				headers: {
					'content-type': 'application/json'
				}
			});
			expect(replySpy.called).to.be.true;
		});

		it('should create a request handler for a controller method that fails', async () => {
			const agnosticRouterModule = new AgnosticRouter();
			class MyController {
				@route.get({ path: '/all' })
				getAll(@route.query() filter: string) {
					throw new Error('Invalid');
					return { filter };
				}
			}
			const controller = new MyController();
			const replySpy = sinon.spy(agnosticRouterModule, 'reply');
			const controllerReflection = reflect(MyController);
			const methodReflection = controllerReflection.methods[0];
			const req = { query: { filter: 'myFilter' } };
			const res = {};
			const parametersConfig = await agnosticRouterModule.createParametersConfigurations({
				controllerReflection,
				methodReflection
			});

			const handler = await agnosticRouterModule.createRequestHandler(controller, 'getAll', {
				path: '/all',
				verb: 'get',
				parametersConfig,
				controllerReflection,
				methodReflection
			});
			// @ts-ignore
			const result = await handler(req, res);

			expect(result).to.containSubset({
				content: {
					error: true,
					message: 'Invalid'
				},
				status: 500,
				headers: {
					'content-type': 'application/json'
				}
			});

			expect(replySpy.called).to.be.true;
		});
	});

	describe('#createRoutes', () => {
		it('should walk the controller reflection and register routes in itty router', async () => {
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

			const agnosticRouterModule = new AgnosticRouter();
			app.registerController(MyController);
			app.registerModule(agnosticRouterModule);
			await app.init();

			const router = agnosticRouterModule.getInstance();
			expect(router.routes).to.containSubset([
				['GET'],
				['PATCH'],
				['PUT'],
				['POST'],
				['DELETE'],
				['HEAD'],
				['OPTIONS'],
				['ALL']
			]);
		});
	});
});
