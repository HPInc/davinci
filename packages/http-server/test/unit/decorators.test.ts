/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { reflect } from '@davinci/reflector';
import { route } from '../../src';
import { expect } from '../support/chai';

describe('decorators', () => {
	describe('controller', () => {
		it('should decorate controllers', () => {
			@route.controller({ basePath: '/customers' })
			class CustomerController {}

			const reflection = reflect(CustomerController);

			expect(reflection).to.containSubset({
				kind: 'Class',
				name: 'CustomerController',
				decorators: [
					{
						module: 'http-server',
						type: 'controller',
						options: {
							basePath: '/customers'
						}
					}
				],
				methods: [],
				properties: [],
				ctor: {
					kind: 'Constructor',
					name: 'constructor',
					parameters: []
				},
				typeClassification: 'Class'
			});
		});

		it('should apply the decorator from the class itself, not the one from the super class', () => {
			@route.controller({ basePath: '/base' })
			class BaseController {}

			@route.controller({ basePath: '/customers' })
			class CustomerController extends BaseController {}

			const reflection = reflect(CustomerController);

			expect(reflection).to.containSubset({
				kind: 'Class',
				name: 'CustomerController',
				decorators: [
					{
						module: 'http-server',
						type: 'controller',
						options: {
							basePath: '/customers'
						}
					}
				],
				methods: [],
				properties: [],
				ctor: {
					kind: 'Constructor',
					name: 'constructor',
					parameters: []
				},
				typeClassification: 'Class'
			});
		});

		it('should apply the decorator from the super class, if not defined on the class itself', () => {
			@route.controller({ basePath: '/base' })
			class BaseController {}

			class CustomerController extends BaseController {}

			const reflection = reflect(CustomerController);

			expect(reflection).to.containSubset({
				kind: 'Class',
				name: 'CustomerController',
				decorators: [
					{
						module: 'http-server',
						type: 'controller',
						options: {
							basePath: '/base'
						}
					}
				],
				methods: [],
				properties: [],
				ctor: {
					kind: 'Constructor',
					name: 'constructor',
					parameters: []
				},
				typeClassification: 'Class'
			});
		});
	});

	describe('methods', () => {
		it('should decorate methods', () => {
			class CustomerController {
				@route.get({ path: '/', summary: 'Get customers', description: 'Get a list of customers' })
				get() {}

				@route.post({ path: '/', summary: 'Create customers', description: 'Create customers' })
				post() {}
			}

			const reflection = reflect(CustomerController);

			expect(reflection).to.containSubset({
				methods: [
					{
						kind: 'Method',
						name: 'get',
						parameters: [],
						decorators: [
							{
								module: 'http-server',
								type: 'route',
								verb: 'get',
								options: {
									path: '/',
									summary: 'Get customers',
									description: 'Get a list of customers'
								}
							}
						]
					},
					{
						kind: 'Method',
						name: 'post',
						parameters: [],
						decorators: [
							{
								module: 'http-server',
								type: 'route',
								verb: 'post',
								options: {
									path: '/',
									summary: 'Create customers',
									description: 'Create customers'
								}
							}
						]
					}
				]
			});
		});

		it('should allow multiple decorators on a single method', () => {
			class CustomerController {
				@route.get({ path: '/', summary: 'Get customers', description: 'Get a list of customers' })
				@route.post({ path: '/', summary: 'Create customers', description: 'Create customers' })
				getpost() {}
			}

			const reflection = reflect(CustomerController);

			expect(reflection).to.containSubset({
				methods: [
					{
						kind: 'Method',
						name: 'getpost',
						parameters: [],
						decorators: [
							{
								module: 'http-server',
								type: 'route',
								verb: 'get',
								options: {
									path: '/',
									summary: 'Get customers',
									description: 'Get a list of customers'
								}
							},
							{
								module: 'http-server',
								type: 'route',
								verb: 'post',
								options: {
									path: '/',
									summary: 'Create customers',
									description: 'Create customers'
								}
							}
						]
					}
				]
			});
		});

		it('should apply the decorator from the class itself, not the one from the super class', () => {
			class BaseController {
				@route.get({ path: '/', summary: 'Base method', description: 'Base method' })
				get() {}
			}

			class CustomerController extends BaseController {
				@route.get({ path: '/', summary: 'Get customers', description: 'Get a list of customers' })
				get() {}
			}

			const reflection = reflect(CustomerController);

			expect(reflection).to.containSubset({
				methods: [
					{
						kind: 'Method',
						name: 'get',
						parameters: [],
						decorators: [
							{
								module: 'http-server',
								type: 'route',
								verb: 'get',
								options: {
									path: '/',
									summary: 'Get customers',
									description: 'Get a list of customers'
								}
							}
						]
					}
				]
			});
		});

		it('should inherit methods and decorators from the super class', () => {
			class BaseController {
				@route.get({ path: '/', summary: 'List method', description: 'List method' })
				get() {}

				@route.post({ path: '/', summary: 'Create method', description: 'Create method' })
				create() {}
			}

			class CustomerController extends BaseController {
				@route.patch({ path: '/:id', summary: 'Modify customer', description: 'Modify customer' })
				patch() {}
			}

			const reflection = reflect(CustomerController);

			expect(reflection).to.containSubset({
				methods: [
					{
						kind: 'Method',
						name: 'patch',
						parameters: [],
						decorators: [
							{
								module: 'http-server',
								type: 'route',
								verb: 'patch',
								options: {
									path: '/:id',
									summary: 'Modify customer',
									description: 'Modify customer'
								}
							}
						]
					},
					{
						kind: 'Method',
						name: 'get',
						parameters: [],
						decorators: [
							{
								module: 'http-server',
								type: 'route',
								verb: 'get',
								options: {
									path: '/',
									summary: 'List method',
									description: 'List method'
								}
							}
						]
					},
					{
						kind: 'Method',
						name: 'create',
						parameters: [],
						decorators: [
							{
								module: 'http-server',
								type: 'route',
								verb: 'post',
								options: {
									path: '/',
									summary: 'Create method',
									description: 'Create method'
								}
							}
						]
					}
				],
				properties: [],
				ctor: {
					kind: 'Constructor',
					name: 'constructor',
					parameters: []
				},
				typeClassification: 'Class'
			});
		});
	});

	describe('parameters', () => {
		it('should decorate parameters', () => {
			class CustomerController {
				get(
					@route.query({ name: 'a custom name' }) query: string,
					@route.body({ required: true, description: 'The body' }) body: object,
					@route.request() req,
					@route.response() res
				) {
					if (body) {
					}
					return {
						query,
						req,
						res
					};
				}
			}

			const reflection = reflect(CustomerController);

			expect(reflection).to.containSubset({
				methods: [
					{
						kind: 'Method',
						name: 'get',
						parameters: [
							{
								kind: 'Parameter',
								name: 'query',
								decorators: [
									{
										module: 'http-server',
										type: 'parameter',
										options: {
											in: 'query',
											name: 'a custom name'
										}
									}
								],
								fields: 'query',
								index: 0,
								typeClassification: 'Primitive'
							},
							{
								kind: 'Parameter',
								name: 'body',
								decorators: [
									{
										module: 'http-server',
										type: 'parameter',
										options: {
											in: 'body',
											required: true,
											description: 'The body'
										}
									}
								],
								fields: 'body',
								index: 1,
								typeClassification: 'Primitive'
							},
							{
								kind: 'Parameter',
								name: 'req',
								decorators: [
									{
										module: 'http-server',
										type: 'request'
									}
								],
								fields: 'req',
								index: 2,
								typeClassification: 'Primitive'
							},
							{
								kind: 'Parameter',
								name: 'res',
								decorators: [
									{
										module: 'http-server',
										type: 'response'
									}
								],
								fields: 'res',
								index: 3,
								typeClassification: 'Primitive'
							}
						]
					}
				]
			});
		});

		it('should apply the decorator from the class itself, not the one from the super class', () => {
			class BaseController {
				get(
					@route.query({ name: 'super class query name' }) query: string,
					@route.body({ required: false, description: 'The body' }) body: object
				) {
					console.log(query, body);
					return {
						query
					};
				}
			}

			class CustomerController extends BaseController {
				get(
					@route.query({ name: 'a custom name' }) query: string,
					@route.body({ required: true, description: 'The body' }) body: object
				) {
					console.log(query, body);
					return {
						query
					};
				}
			}

			const reflection = reflect(CustomerController);

			expect(reflection).to.containSubset({
				methods: [
					{
						kind: 'Method',
						name: 'get',
						parameters: [
							{
								kind: 'Parameter',
								name: 'query',
								decorators: [
									{
										module: 'http-server',
										type: 'parameter',
										options: {
											in: 'query',
											name: 'a custom name'
										}
									}
								],
								fields: 'query',
								index: 0,
								typeClassification: 'Primitive'
							},
							{
								kind: 'Parameter',
								name: 'body',
								decorators: [
									{
										module: 'http-server',
										type: 'parameter',
										options: {
											in: 'body',
											required: true,
											description: 'The body'
										}
									}
								],
								fields: 'body',
								index: 1,
								typeClassification: 'Primitive'
							}
						],
						decorators: []
					}
				]
			});
		});

		it('should inherit methods and decorators from the super class', () => {
			class BaseController {
				get(@route.query() query: string) {
					console.log(query);
				}

				create(@route.body() body: object) {
					console.log(body);
				}
			}

			class CustomerController extends BaseController {
				patch() {}
			}

			const reflection = reflect(CustomerController);

			expect(reflection).to.containSubset({
				methods: [
					{
						kind: 'Method',
						name: 'patch',
						parameters: [],
						decorators: []
					},
					{
						kind: 'Method',
						name: 'get',
						parameters: [
							{
								kind: 'Parameter',
								name: 'query',
								decorators: [
									{
										module: 'http-server',
										type: 'parameter',
										options: {
											in: 'query'
										}
									}
								],
								fields: 'query',
								index: 0,
								typeClassification: 'Primitive'
							}
						],
						decorators: []
					},
					{
						kind: 'Method',
						name: 'create',
						parameters: [
							{
								kind: 'Parameter',
								name: 'body',
								decorators: [
									{
										module: 'http-server',
										type: 'parameter',
										options: {
											in: 'body'
										}
									}
								],
								fields: 'body',
								index: 0,
								typeClassification: 'Primitive'
							}
						],
						decorators: []
					}
				]
			});
		});
	});
});
