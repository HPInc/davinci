/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import should from 'should';
import { mapParallel, mapSeries } from '../../../src/lib/async-utils';

describe('async mappers', () => {
	describe('mapSeries', () => {
		it('should process the items in series', async () => {
			const data = [1, 2, 3, 4, 5];

			let lock = false;
			const result = await mapSeries(data, async item => {
				should(lock).be.False();
				lock = true;

				return new Promise<number>(resolve => {
					setTimeout(() => {
						resolve(item);
						lock = false;
					}, 50);
				});
			});

			should(result).be.deepEqual(data);
		});
	});

	describe('mapParallel', () => {
		it('should process the items in parallel', async () => {
			const data = [1, 2, 3, 4, 5];

			let lock = false;
			const result = await mapParallel(data, async (item, index) => {
				if (index === 0) {
					should(lock).be.False();
				}
				if (index > 0) {
					should(lock).be.True();
				}
				lock = true;

				return new Promise<number>(resolve => {
					setTimeout(() => {
						resolve(item);
						lock = false;
					}, 50);
				});
			});

			should(result).be.deepEqual(data);
		});
	});
});
