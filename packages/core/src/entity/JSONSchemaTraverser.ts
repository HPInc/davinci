/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

// code taken from: https://github.com/epoberezkin/json-schema-traverse
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

export interface Options {
	allKeys?: boolean;
}

export class JSONSchemaTraverser {
	static KEYWORDS = {
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
	static ARRAY_KEYWORDS = {
		items: true,
		allOf: true,
		anyOf: true,
		oneOf: true
	};
	static PROPS_KEYWORDS = {
		$defs: true,
		definitions: true,
		properties: true,
		patternProperties: true,
		dependencies: true
	};
	static SKIP_KEYWORDS = {
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

	public static traverse(schema: SchemaObject, cb: Callback, opts?: Options) {
		this.recursiveTraverse(opts, cb, schema, '', schema);
	}

	private static recursiveTraverse(
		opts: Options,
		cb: Callback,
		schema: SchemaObject,
		jsonPtr: string,
		rootSchema: SchemaObject,
		parentJsonPtr?: string,
		parentKeyword?: string,
		parentSchema?: SchemaObject,
		keyIndex?: number | string
	) {
		if (schema && !Array.isArray(schema)) {
			cb({ schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex });

			if (!isPlainObject(schema)) {
				return;
			}

			Object.keys(schema).forEach(key => {
				const sch = schema[key];

				if (Array.isArray(sch)) {
					if (key in this.ARRAY_KEYWORDS) {
						sch.forEach((_v, i) =>
							this.recursiveTraverse(
								opts,
								cb,
								sch[i],
								`${jsonPtr}/${key}/${i}`,
								rootSchema,
								jsonPtr,
								key,
								schema,
								i
							)
						);
						return;
					}
				}

				if (key in this.PROPS_KEYWORDS) {
					if (sch && typeof sch === 'object') {
						Object.keys(sch).forEach(prop =>
							this.recursiveTraverse(
								opts,
								cb,
								sch[prop],
								`${jsonPtr}/${key}/${this.escapeJsonPtr(prop)}`,
								rootSchema,
								jsonPtr,
								key,
								schema,
								prop
							)
						);
						return;
					}
				}
				if (key in this.KEYWORDS || (opts?.allKeys && !(key in this.SKIP_KEYWORDS))) {
					this.recursiveTraverse(opts, cb, sch, `${jsonPtr}/${key}`, rootSchema, jsonPtr, key, schema);
				}
			});
		}
	}

	private static escapeJsonPtr(str: string): string {
		return str.replace(/~/g, '~0').replace(/\//g, '~1');
	}
}
