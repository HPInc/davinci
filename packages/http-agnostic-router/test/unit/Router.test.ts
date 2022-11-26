/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { mapSeries } from '@davinci/core';
import { Method, Router } from '../../src';
import { expect } from '../support/chai';

describe('Router', () => {
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

			router[method]('/phones/*', identity);
			await expect(router.handle({ url: '/phones/first/second?test=1', method })).to.eventually.be.deep.equal({
				method,
				url: '/phones/first/second?test=1',
				query: { test: '1' }
			});

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
