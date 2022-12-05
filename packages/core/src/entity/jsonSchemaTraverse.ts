/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

// Credits for the following implementation: https://github.com/epoberezkin/json-schema-traverse

import { isPlainObject } from '../lib/object-utils';

interface SchemaObject {
	$id?: string;
	$schema?: string;
	[key: string]: any;
}

export interface CallbackArgs {
	schema: SchemaObject;
	jsonPtr: string;
	rootSchema: SchemaObject;
	parentJsonPtr?: string;
	parentKeyword?: string;
	parentSchema?: SchemaObject;
	keyIndex?: string | number;
}

export type Callback = (args: CallbackArgs) => void;

interface Options {
	allKeys?: boolean;
	cb?:
		| Callback
		| {
				pre?: Callback;
				post?: Callback;
		  };
}

function escapeJsonPtr(str: string): string {
	return str.replace(/~/g, '~0').replace(/\//g, '~1');
}

function recursiveTraverse(
	opts: Options,
	pre: Callback,
	post: Callback,
	schema: SchemaObject,
	jsonPtr: string,
	rootSchema: SchemaObject,
	parentJsonPtr?: string,
	parentKeyword?: string,
	parentSchema?: SchemaObject,
	keyIndex?: number | string
) {
	if (schema && !Array.isArray(schema)) {
		pre({ schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex });
		if (isPlainObject(schema)) {
			// eslint-disable-next-line guard-for-in,no-restricted-syntax
			for (const key in schema) {
				const sch = schema[key];
				if (Array.isArray(sch)) {
					// eslint-disable-next-line no-use-before-define
					if (key in jsonSchemaTraverse.arrayKeywords) {
						for (let i = 0; i < sch.length; i++)
							recursiveTraverse(
								opts,
								pre,
								post,
								sch[i],
								`${jsonPtr}/${key}/${i}`,
								rootSchema,
								jsonPtr,
								key,
								schema,
								i
							);
					}
					// eslint-disable-next-line no-use-before-define
				} else if (key in jsonSchemaTraverse.propsKeywords) {
					if (sch && typeof sch === 'object') {
						// eslint-disable-next-line guard-for-in,no-restricted-syntax
						for (const prop in sch)
							recursiveTraverse(
								opts,
								pre,
								post,
								sch[prop],
								`${jsonPtr}/${key}/${escapeJsonPtr(prop)}`,
								rootSchema,
								jsonPtr,
								key,
								schema,
								prop
							);
					}
					// eslint-disable-next-line no-use-before-define
				} else if (
					// eslint-disable-next-line no-use-before-define
					key in jsonSchemaTraverse.keywords ||
					// eslint-disable-next-line no-use-before-define
					(opts.allKeys && !(key in jsonSchemaTraverse.skipKeywords))
				) {
					recursiveTraverse(opts, pre, post, sch, `${jsonPtr}/${key}`, rootSchema, jsonPtr, key, schema);
				}
			}
		}
		post({ schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex });
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const voidFn = () => {};

export function jsonSchemaTraverse(schema: SchemaObject, opts: Options, cb?: Callback): void;
export function jsonSchemaTraverse(schema: SchemaObject, cb: Callback): void;
export function jsonSchemaTraverse(schema: SchemaObject, ...args) {
	let opts: Options = args[0];
	let cb: Options['cb'] = args[1];
	// Legacy support for v0.3.1 and earlier.
	if (typeof args[0] === 'function') {
		cb = args[0];
		opts = {};
	}

	cb = opts.cb || cb;
	const pre = typeof cb === 'function' ? cb : cb.pre || voidFn;
	const post = 'post' in cb ? cb.post : voidFn;

	recursiveTraverse(opts, pre, post, schema, '', schema);
}

jsonSchemaTraverse.keywords = {
	additionalItems: true,
	items: true,
	contains: true,
	additionalProperties: true,
	propertyNames: true,
	not: true,
	if: true,
	then: true,
	else: true
};

jsonSchemaTraverse.arrayKeywords = {
	items: true,
	allOf: true,
	anyOf: true,
	oneOf: true
};

jsonSchemaTraverse.propsKeywords = {
	$defs: true,
	definitions: true,
	properties: true,
	patternProperties: true,
	dependencies: true
};

jsonSchemaTraverse.skipKeywords = {
	default: true,
	enum: true,
	const: true,
	required: true,
	maximum: true,
	minimum: true,
	exclusiveMaximum: true,
	exclusiveMinimum: true,
	multipleOf: true,
	maxLength: true,
	minLength: true,
	pattern: true,
	format: true,
	maxItems: true,
	minItems: true,
	uniqueItems: true,
	maxProperties: true,
	minProperties: true
};
