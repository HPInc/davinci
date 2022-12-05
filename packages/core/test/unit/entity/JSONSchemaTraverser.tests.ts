/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { JSONSchema } from '../../../src';
import { JSONSchemaTraverser } from '../../../src/entity/JSONSchemaTraverser';
import { expect } from '../../support/chai';

describe('json-schema-traverse', () => {
	it('should traverse the json schema object', () => {
		// @ts-ignore
		const jsonSchema: JSONSchema = {
			type: 'object',
			properties: {
				firstname: {
					type: 'string'
				},
				lastname: {
					type: 'string'
				},
				addresses: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							line1: {
								type: 'string'
							},
							number: {
								type: 'number'
							},
							startDate: {
								type: 'string',
								format: 'date-time'
							}
						}
					}
				},
				category: {
					anyOf: [
						{ $ref: 'Manager' },
						{
							$id: 'Employee',
							type: 'object',
							properties: {
								code: { type: 'string' },
								commenceDate: { type: 'string' }
							}
						}
					]
				}
			},
			required: ['lastname']
		};
		const calls = [];

		JSONSchemaTraverser.traverse(jsonSchema, args => {
			calls.push(args);
		});

		expect(calls).to.containSubset([
			{
				schema: jsonSchema,
				jsonPtr: '',
				rootSchema: jsonSchema
			},
			{
				schema: jsonSchema.properties.firstname,
				jsonPtr: '/properties/firstname',
				rootSchema: jsonSchema,
				parentJsonPtr: '',
				parentKeyword: 'properties',
				parentSchema: jsonSchema,
				keyIndex: 'firstname'
			},
			{
				schema: jsonSchema.properties.lastname,
				jsonPtr: '/properties/lastname',
				rootSchema: jsonSchema,
				parentJsonPtr: '',
				parentKeyword: 'properties',
				parentSchema: jsonSchema,
				keyIndex: 'lastname'
			},
			{
				schema: jsonSchema.properties.addresses,
				jsonPtr: '/properties/addresses',
				rootSchema: jsonSchema,
				parentJsonPtr: '',
				parentKeyword: 'properties',
				parentSchema: jsonSchema,
				keyIndex: 'addresses'
			},
			{
				schema: jsonSchema.properties.addresses.items,
				jsonPtr: '/properties/addresses/items',
				rootSchema: jsonSchema,
				parentJsonPtr: '/properties/addresses',
				parentKeyword: 'items',
				parentSchema: jsonSchema.properties.addresses
			},
			{
				schema: jsonSchema.properties.addresses.items.properties.line1,
				jsonPtr: '/properties/addresses/items/properties/line1',
				rootSchema: jsonSchema,
				parentJsonPtr: '/properties/addresses/items',
				parentKeyword: 'properties',
				parentSchema: jsonSchema.properties.addresses.items,
				keyIndex: 'line1'
			},
			{
				schema: jsonSchema.properties.addresses.items.properties.number,
				jsonPtr: '/properties/addresses/items/properties/number',
				rootSchema: jsonSchema,
				parentJsonPtr: '/properties/addresses/items',
				parentKeyword: 'properties',
				parentSchema: jsonSchema.properties.addresses.items,
				keyIndex: 'number'
			},
			{
				schema: jsonSchema.properties.addresses.items.properties.startDate,
				jsonPtr: '/properties/addresses/items/properties/startDate',
				rootSchema: jsonSchema,
				parentJsonPtr: '/properties/addresses/items',
				parentKeyword: 'properties',
				parentSchema: jsonSchema.properties.addresses.items,
				keyIndex: 'startDate'
			},
			////////////////////////////////////////////////////
			{
				schema: jsonSchema.properties.category,
				jsonPtr: '/properties/category',
				rootSchema: jsonSchema,
				parentJsonPtr: '',
				parentKeyword: 'properties',
				parentSchema: jsonSchema,
				keyIndex: 'category'
			},
			{
				schema: jsonSchema.properties.category.anyOf[0],
				jsonPtr: '/properties/category/anyOf/0',
				rootSchema: jsonSchema,
				parentJsonPtr: '/properties/category',
				parentKeyword: 'anyOf',
				parentSchema: jsonSchema.properties.category,
				keyIndex: 0
			},
			{
				schema: jsonSchema.properties.category.anyOf[1],
				jsonPtr: '/properties/category/anyOf/1',
				rootSchema: jsonSchema,
				parentJsonPtr: '/properties/category',
				parentKeyword: 'anyOf',
				parentSchema: jsonSchema.properties.category,
				keyIndex: 1
			},
			{
				schema: jsonSchema.properties.category.anyOf[1].properties.code,
				jsonPtr: '/properties/category/anyOf/1/properties/code',
				rootSchema: jsonSchema,
				parentJsonPtr: '/properties/category/anyOf/1',
				parentKeyword: 'properties',
				parentSchema: jsonSchema.properties.category.anyOf[1],
				keyIndex: 'code'
			},
			{
				schema: jsonSchema.properties.category.anyOf[1].properties.commenceDate,
				jsonPtr: '/properties/category/anyOf/1/properties/commenceDate',
				rootSchema: jsonSchema,
				parentJsonPtr: '/properties/category/anyOf/1',
				parentKeyword: 'properties',
				parentSchema: jsonSchema.properties.category.anyOf[1],
				keyIndex: 'commenceDate'
			}
		]);
	});
});
