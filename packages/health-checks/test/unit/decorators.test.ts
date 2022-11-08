/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { DecoratorId, reflect } from '@davinci/reflector';
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

		it('should support multiple decorators', () => {
			class CustomerController {
				@healthCheck('readiness')
				@healthCheck('liveness')
				check() {}
			}

			const reflection = reflect(CustomerController);

			expect(reflection).to.containSubset({
				kind: 'Class',
				name: 'CustomerController',
				decorators: [],
				methods: [
					{
						kind: 'Method',
						name: 'check',
						parameters: [],
						decorators: [
							{
								[DecoratorId]: 'health-check.method',
								healthCheckName: 'readiness'
							},
							{
								[DecoratorId]: 'health-check.method',
								healthCheckName: 'liveness'
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
