/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { TypeValue } from '@davinci/reflector';
import { EntityDefinition } from './EntityDefinition';
import { JSONSchema } from './types';

const primitiveTypes = [String, Number, Boolean, Date] as unknown[];

export class EntityRegistry {
	// entityDefinitions = new Set<EntityDefinition[]>();
	entityDefinitionMap = new Map<TypeValue, EntityDefinition>();

	public getJsonSchema(typeValue: TypeValue): Partial<JSONSchema> {
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
			return this.entityDefinitionMap.get(typeValue).getJsonSchema();
		}

		const entityDefinition = new EntityDefinition({
			type: typeValue,
			entityDefinitionsMapCache: this.entityDefinitionMap
		});

		this.entityDefinitionMap.set(typeValue, entityDefinition);
		const relatedEntitiesMap = entityDefinition.getRelatedEntityDefinitionsMap();
		relatedEntitiesMap.forEach((value, key) => this.entityDefinitionMap.set(key, value));

		return entityDefinition.getJsonSchema();
	}

	getEntityDefinitionMap() {
		return this.entityDefinitionMap;
	}
}
