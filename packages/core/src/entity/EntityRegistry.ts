/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { TypeValue } from '@davinci/reflector';
import set from 'lodash.set';
import * as jsonSchemaTraverse from './jsonSchemaTraverse';
import { EntityDefinition } from './EntityDefinition';
import { EntityDefinitionJSONSchema } from './types';
import { di } from '../di';

const primitiveTypes = [String, Number, Boolean, Date] as unknown[];

@di.singleton()
export class EntityRegistry {
	private entityDefinitionMap = new Map<TypeValue, EntityDefinition>();
	// private jsonSchemasMap = new Map<TypeValue, JSONSchema>();

	public getEntityDefinitionJsonSchema(typeValue: TypeValue): Partial<EntityDefinitionJSONSchema> {
		const isPrimitiveType = primitiveTypes.includes(typeValue);
		if (isPrimitiveType) {
			const type = typeValue as StringConstructor | NumberConstructor | BooleanConstructor | DateConstructor;

			if (primitiveTypes.includes(typeValue)) {
				if (typeValue === Date) {
					return { type: 'string', format: 'date-time' };
				}

				return { type: type.name.toLowerCase() };
			}
		}

		if (this.entityDefinitionMap.has(typeValue)) {
			return this.entityDefinitionMap.get(typeValue).getEntityDefinitionJsonSchema();
		}

		const entityDefinition = new EntityDefinition({
			type: typeValue,
			entityDefinitionsMapCache: this.entityDefinitionMap
		});

		this.entityDefinitionMap.set(typeValue, entityDefinition);

		return entityDefinition.getEntityDefinitionJsonSchema();
	}

	public getEntityDefinitionMap() {
		return this.entityDefinitionMap;
	}

	public transformEntityDefinitionSchema(
		entityDefinitionSchema: Partial<EntityDefinitionJSONSchema>,
		cb: (args: jsonSchemaTraverse.CallbackArgs & { pointerPath: string; pointerPathParts: string[] }) => {
			path: string;
			value: unknown;
		}
	) {
		let obj = {};
		jsonSchemaTraverse.jsonSchemaTraverse(
			entityDefinitionSchema,
			{ allKeys: true },
			({ schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex }) => {
				const pointerPath = jsonPtr
					// .replace(/(\/properties)(\/\w+)/g, '$2')
					.replace(/\//g, '.')
					.slice(1);
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
						set(obj, result.path, result.value);
					}
				}
			}
		);

		return obj;
	}
}
