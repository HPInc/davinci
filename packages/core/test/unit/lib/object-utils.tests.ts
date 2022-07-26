/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { expect } from 'chai';
import { mapObject } from '../../../src';

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
});
