/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import set from 'immutable-set';
import { EntityDefinitionJSONSchema, TransformEntityDefinitionSchemaCallback } from '../types';
import { JSONSchemaTraverser } from './JSONSchemaTraverser';

export function transformEntityDefinitionSchema(
	entityDefinitionSchema: Partial<EntityDefinitionJSONSchema>,
	cb: TransformEntityDefinitionSchemaCallback
) {
	let obj = {};
	JSONSchemaTraverser.traverse(
		entityDefinitionSchema,
		({ schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex }) => {
			const pointerPath = jsonPtr
				.replace(/\//g, '.') // replace slashes with dots
				.replace(/(\.(\d))((\.)|$)/g, '[$2]$3') // replace `.{number}.` to `[number].
				.slice(1); // remove trailing slash
			const pointerPathParts = pointerPath.split('.');

			const result = cb({
				schema,
				jsonPtr,
				pointerPath,
				pointerPathParts,
				rootSchema,
				parentJsonPtr,
				parentKeyword,
				parentSchema,
				keyIndex
			});

			if (result && typeof result.path !== 'undefined' && result.path !== null) {
				if (result.path === '') {
					obj = result.value;
				} else {
					obj = set(obj, result.path, result.value, { withArrays: true });
				}
			}
		},
		{ allKeys: true }
	);

	return obj;
}
