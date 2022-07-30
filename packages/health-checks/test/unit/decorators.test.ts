/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { reflect } from '@davinci/reflector';
import { healthCheck } from '../../src';
import { expect } from '../support/chai';

describe('decorators', () => {
	describe('healthCheck', () => {
		it('should decorate methods', () => {
			class CustomerController {
				@healthCheck('readiness')
				readinessCheck() {}
			}

			const reflection = reflect(CustomerController);

			expect(reflection).to.containSubset({
				kind: 'Class',
				name: 'CustomerController',
				decorators: [],
				methods: [
					{
						kind: 'Method',
						name: 'readinessCheck',
						parameters: [],
						decorators: [
							{
								healthCheckName: 'readiness'
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
});
