/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { expect } from 'chai';
import { isPlainObject, mapObject, omit } from '../../../src';

describe('object-utils', () => {
	describe('mapValues', () => {
		it('should map over object values', () => {
			const input = {
				a: 1,
				b: 2
			};

			const result = mapObject<Record<string, number>>(input, (value, key) => {
				return `${key}${value}`;
			});

			expect(result).to.be.deep.equal({ a: 'a1', b: 'b2' });
		});
	});

	describe('omit', () => {
		it('should create a new object without the keys specified', () => {
			const input = {
				a: 1,
				b: 2,
				c: 3
			};

			const result = omit(input, ['a', 'c']);

			expect(result).to.be.deep.equal({ b: 2 });
		});

		it('should returns the original object if keys are empty', () => {
			const input = {
				a: 1,
				b: 2,
				c: 3
			};

			const result = omit(input, []);

			expect(result).to.be.deep.equal(input);
		});

		it('should handle null or undefined', () => {
			expect(omit(null, [])).to.be.equal(null);
			expect(omit(undefined, [])).to.be.equal(undefined);
		});
	});

	describe('#isPlainObject', () => {
		it('should return false if a not plain object is passed', () => {
			expect(isPlainObject(1)).to.be.false;
			expect(isPlainObject(null)).to.be.false;
			expect(isPlainObject('string')).to.be.false;
			expect(isPlainObject(() => {})).to.be.false;
		});

		it('should return true if a a plain object is passed', () => {
			expect(isPlainObject({})).to.be.true;
		});
	});
});
