/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { TypeValue } from '@davinci/reflector';
import { EntityDefinition } from './EntityDefinition';
import { EntityDefinitionJSONSchema } from './types';
import { di } from '../di';

const primitiveTypes = [String, Number, Boolean, Date] as unknown[];

/**
 * The EntityRegistry class stores all of the EntityDefinition objects and provides a way
 * to cache and retrieve the EntityDefinitionJSONSchema objects.
 */
@di.singleton()
export class EntityRegistry {
	private entityDefinitionMap = new Map<TypeValue, EntityDefinition>();

	public getEntityDefinitionJsonSchema(typeValue: TypeValue): EntityDefinitionJSONSchema {
		const isPrimitiveType = primitiveTypes.includes(typeValue);
		if (isPrimitiveType) {
			const type = typeValue as StringConstructor | NumberConstructor | BooleanConstructor | DateConstructor;

			if (primitiveTypes.includes(typeValue)) {
				if (typeValue === Date) {
					return { type: 'string', format: 'date-time' };
				}

				return { type: type.name.toLowerCase() } as EntityDefinitionJSONSchema;
			}
		}

		if (this.entityDefinitionMap.has(typeValue)) {
			return this.entityDefinitionMap
				.get(typeValue)
				?.getEntityDefinitionJsonSchema() as EntityDefinitionJSONSchema;
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
}
