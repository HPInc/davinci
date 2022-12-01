/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { mapParallel, mapSeries, nextTick } from '../../../src';
import { expect } from '../../support/chai';

describe('async mappers', () => {
	describe('mapSeries', () => {
		it('should process the items in series', async () => {
			const data = [1, 2, 3, 4, 5];

			let lock = false;
			const result = await mapSeries(data, async item => {
				expect(lock).to.be.false;
				lock = true;

				return new Promise<number>(resolve => {
					setTimeout(() => {
						resolve(item);
						lock = false;
					}, 50);
				});
			});

			expect(result).to.be.deep.equal(data);
		});
	});

	describe('mapParallel', () => {
		it('should process the items in parallel', async () => {
			const data = [1, 2, 3, 4, 5];

			let lock = false;
			const result = await mapParallel(data, async (item, index) => {
				if (index === 0) {
					expect(lock).to.be.false;
				}
				if (index > 0) {
					expect(lock).to.be.true;
				}
				lock = true;

				return new Promise<number>(resolve => {
					setTimeout(() => {
						resolve(item);
						lock = false;
					}, 50);
				});
			});

			expect(result).to.be.deep.equal(data);
		});
	});

	describe('nextTick', () => {
		it('should execute the function and return a value', async () => {
			function add(num1: number, num2: number) {
				return num1 + num2;
			}

			const result = await nextTick(() => add(1, 2));

			expect(result).to.be.equal(3);
		});

		it('should fail with a reason', async () => {
			const promise = nextTick(() => {
				throw new Error('Something is not right');
			});

			await expect(promise).to.be.rejectedWith('Something is not right');
		});
	});
});
