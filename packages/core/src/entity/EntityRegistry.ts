/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { TypeValue } from '@davinci/reflector';
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

	// '/properties/address/properties/line1/properties/town'.replace(/(\/properties)(\/\w+)/g, '$2').replace(/\//g, '.').slice(1)/
	public transformEntityDefinitionSchema(
		entityDefinitionSchema: Partial<EntityDefinitionJSONSchema>,
		cb: (args: jsonSchemaTraverse.CallbackArgs & { pointerPath: string; pointerPathParts: string[] }) => {
			path: string;
			value: unknown;
		}
	) {
		return jsonSchemaTraverse.jsonSchemaTraverse(
			entityDefinitionSchema,
			{ allKeys: true },
			({ schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex }) => {
				const pointerPath = jsonPtr
					// .replace(/(\/properties)(\/\w+)/g, '$2')
					.replace(/\//g, '.')
					.slice(1);
				const pointerPathParts = pointerPath.split('.');

				cb({
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
			}
		);
	}
}
