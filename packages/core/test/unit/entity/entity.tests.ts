/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { entity } from '../../../src';
import { DecoratorId, reflect } from '@davinci/reflector';
import { expect } from '../../support/chai';

describe('entity decorators', () => {
	it('should decorate class properties', async () => {
		class BaseClass {
			@entity.prop()
			firstname: string;

			@entity.prop()
			lastname: string;

			@entity.prop({ required: true })
			email: string;
		}
		class Phone {
			@entity.prop()
			isDefault: boolean;

			@entity.prop()
			number: number;
		}
		@entity({ name: 'MyCustomer' })
		class Customer extends BaseClass {
			@entity.prop({ required: true, minLength: 2 })
			firstname: string;

			@entity.prop({ required: true, minLength: 2 })
			lastname: string;

			@entity.prop()
			age: number;

			@entity.prop({ type: [Phone] })
			phones: Phone[];
		}

		const reflection = reflect(Customer);
		expect(reflection).to.containSubset({
			kind: 'Class',
			name: 'Customer',
			decorators: [
				{
					[DecoratorId]: 'entity',
					options: {
						name: 'MyCustomer'
					}
				}
			],
			methods: [],
			properties: [
				{
					kind: 'Property',
					name: 'firstname',
					decorators: [
						{
							[DecoratorId]: 'entity.prop',
							options: {
								required: true,
								minLength: 2
							}
						}
					],
					type: String,
					typeClassification: 'Primitive'
				},
				{
					kind: 'Property',
					name: 'lastname',
					decorators: [
						{
							[DecoratorId]: 'entity.prop',
							options: {
								required: true,
								minLength: 2
							}
						}
					],
					type: String,
					typeClassification: 'Primitive'
				},
				{
					kind: 'Property',
					name: 'age',
					decorators: [
						{
							[DecoratorId]: 'entity.prop'
						}
					],
					typeClassification: 'Primitive'
				},
				{
					kind: 'Property',
					name: 'phones',
					decorators: [
						{
							[DecoratorId]: 'entity.prop',
							options: {
								type: [Phone]
							}
						}
					],
					type: Array,
					typeClassification: 'Primitive'
				},
				{
					kind: 'Property',
					name: 'email',
					decorators: [
						{
							[DecoratorId]: 'entity.prop',
							options: {
								required: true
							}
						}
					],
					type: String,
					typeClassification: 'Primitive'
				}
			],
			ctor: {
				kind: 'Constructor',
				name: 'constructor',
				parameters: []
			},
			typeClassification: 'Class'
		});
	});
});
