/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassType, DecoratorId, reflect, walker } from '../../src';
import { expect } from '../support/chai';
import { decorateProperty } from '@plumier/reflect';

const entityProp = (options?: { required?: boolean }) => decorateProperty({ [DecoratorId]: 'prop', options });

describe('entity-walker', () => {
	it('should walk the class properties and modify the decorators metadata', () => {
		class Customer {
			@entityProp({ required: true })
			firstname: string;

			@entityProp({ required: true })
			lastname: string;

			@entityProp()
			birthDate: string;

			@entityProp()
			propToRemoveDecoratorsFrom: number;

			@entityProp()
			_internalProp: number;
		}

		// the following example shows how to modify the properties to be optional
		const NewClass = walker<ClassType<Partial<Customer>>>(Customer, meta => {
			if (meta.iterationType === 'class') {
				return { ...meta, name: 'MyCustomer' };
			}

			if (meta.iterationType === 'property') {
				if (meta.name === '_internalProp') {
					return null; // exclude prop
				}
				let decorators;
				if (meta.name === 'propToRemoveDecoratorsFrom') {
					decorators = [];
				} else {
					decorators = meta.decorators.map(d => {
						if (d[DecoratorId] === 'prop') {
							return { ...d, options: { ...d.options, required: false } };
						}

						return d;
					});
				}
				const type = meta.name === 'birthDate' ? Date : meta.type;

				return {
					...meta,
					type,
					decorators
				};
			}

			return null;
		});

		const newClassReflection = reflect(NewClass);

		expect(newClassReflection).to.containSubset({
			kind: 'Class',
			name: 'MyCustomer',
			decorators: [],
			methods: [],
			properties: [
				{
					kind: 'Property',
					name: 'firstname',
					type: String,
					decorators: [
						{
							options: {
								required: false
							}
						}
					]
				},
				{
					kind: 'Property',
					name: 'lastname',
					type: String,
					decorators: [
						{
							options: {
								required: false
							}
						}
					]
				},
				{
					kind: 'Property',
					name: 'birthDate',
					type: Date,
					decorators: [
						{
							options: {
								required: false
							}
						}
					]
				}
			],
			ctor: {
				kind: 'Constructor',
				name: 'constructor',
				parameters: []
			},
			typeClassification: 'Class'
		});

		expect(newClassReflection.properties[2].type).to.be.equal(Date);
		expect(newClassReflection.properties[4]).to.be.undefined;
	});
});
