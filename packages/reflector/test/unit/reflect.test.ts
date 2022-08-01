/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { decorate, reflect } from '../../src';
import { expect } from '../support/chai';

describe('reflect', () => {
	describe('reflect', () => {
		it('should return a representation of the class, with decorators, methods and parameters', () => {
			// create custom decorator
			function cache(duration: number) {
				return decorate({ type: 'cache', duration });
			}

			function cachedParam() {
				return decorate({ type: 'cachedParam' });
			}

			@cache(5)
			class MyAwesomeClass {
				@cache(1) // use it like usual decorator
				awesome(@cachedParam() myParam: string) {
					console.log(myParam);
				}
			}

			const reflected = reflect(MyAwesomeClass);
			expect(reflected).to.containSubset({
				kind: 'Class',
				name: 'MyAwesomeClass',
				decorators: [
					{
						type: 'cache',
						duration: 5
					}
				],
				methods: [
					{
						kind: 'Method',
						name: 'awesome',
						parameters: [
							{
								kind: 'Parameter',
								name: 'myParam',
								decorators: [
									{
										type: 'cachedParam'
									}
								],
								fields: 'myParam',
								index: 0,
								typeClassification: 'Primitive'
							}
						],
						decorators: [
							{
								type: 'cache',
								duration: 1
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
