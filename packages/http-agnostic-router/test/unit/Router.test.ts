/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { mapSeries } from '@davinci/core';
import LRUCache from 'lru-cache';
import { Method, Router } from '../../src';
import { expect } from '../support/chai';
import { afterEach } from 'mocha';

const sinon = require('sinon').createSandbox();

describe('Router', () => {
	afterEach(() => {
		sinon.restore();
	});

	describe('routing', () => {
		it('should register and respond to requests', async () => {
			const router = new Router();
			const identity = req => req;

			const methods: Array<Method> = ['get', 'post', 'patch', 'put', 'delete', 'head', 'options'];

			await mapSeries(methods, async (method: Method) => {
				router[method]('/customers/:id', identity);
				await expect(router.handle({ url: '/customers/100', method })).to.eventually.be.deep.equal({
					method,
					url: '/customers/100',
					params: { id: '100' }
				});

				router[method]('/customers/:customerId/token/:tokenId', identity);
				await expect(
					router.handle({ url: '/customers/100/token/u12lasdj1', method })
				).to.eventually.be.deep.equal({
					method,
					url: '/customers/100/token/u12lasdj1',
					params: { customerId: '100', tokenId: 'u12lasdj1' }
				});

				router[method]('/phones/*', identity);
				await expect(router.handle({ url: '/phones/first/second?test=1', method })).to.eventually.be.deep.equal(
					{
						method,
						url: '/phones/first/second?test=1',
						query: { test: '1' }
					}
				);

				await expect(
					router.handle({
						url: '/customers/100?where[nested]=1',
						method,
						headers: { account: '900' },
						body: { address: 'My street' }
					})
				).to.eventually.be.deep.equal({
					method,
					url: '/customers/100?where[nested]=1',
					params: { id: '100' },
					query: {
						where: { nested: '1' }
					},
					headers: { account: '900' },
					body: { address: 'My street' }
				});

				router[method]('*', () => ({ statusCode: 404 }));
				await expect(
					router.handle({
						url: '/not/existing/route',
						method: 'GET'
					})
				).to.eventually.be.deep.equal({
					statusCode: 404
				});
			});
		});
	});

	describe('cache', () => {
		it('should hit the cache', async () => {
			const cache = new LRUCache({ max: 500 });
			const cacheSetSpy = sinon.spy(cache, 'set');

			const router = new Router({ cache });
			const findRequestRouteSpy = sinon.spy(router, 'findRequestRoute');
			const identity = req => req;
			router.get('/api/customers/:customerId', identity);

			await router.handle({ url: '/api/customers/123', method: 'get' });
			await router.handle({ url: '/api/customers/123', method: 'get' });

			expect(findRequestRouteSpy.callCount).to.be.equal(1);
			expect(cacheSetSpy.callCount).to.be.equal(1);
		});

		it('should miss the cache for different urls', async () => {
			const cache = new LRUCache({ max: 500 });
			const cacheSetSpy = sinon.spy(cache, 'set');

			const router = new Router({ cache });
			const findRequestRouteSpy = sinon.spy(router, 'findRequestRoute');
			const identity = req => req;
			router.get('/api/customers/:customerId', identity);

			await router.handle({ url: '/api/customers/123', method: 'get' });
			await router.handle({ url: '/api/customers/1239123', method: 'get' });

			expect(findRequestRouteSpy.callCount).to.be.equal(2);
			expect(cacheSetSpy.callCount).to.be.equal(2);
		});

		it('should miss the cache for different methods', async () => {
			const cache = new LRUCache({ max: 500 });
			const cacheSetSpy = sinon.spy(cache, 'set');

			const router = new Router({ cache });
			const findRequestRouteSpy = sinon.spy(router, 'findRequestRoute');
			const identity = req => req;
			router.get('/api/customers/:customerId', identity);
			router.post('/api/customers/:customerId', identity);

			await router.handle({ url: '/api/customers/123', method: 'get' });
			await router.handle({ url: '/api/customers/123', method: 'post' });

			expect(findRequestRouteSpy.callCount).to.be.equal(2);
			expect(cacheSetSpy.callCount).to.be.equal(2);
		});
	});
});
