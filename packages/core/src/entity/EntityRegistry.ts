/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { TypeValue } from '@davinci/reflector';
import { EntityDefinition } from './EntityDefinition';

export class EntityRegistry {
	// entityDefinitions = new Set<EntityDefinition[]>();
	entityDefinitionMap = new Map<TypeValue, EntityDefinition>();

	public addEntity(typeValue: TypeValue): EntityDefinition {
		if (this.entityDefinitionMap.has(typeValue)) {
			return this.entityDefinitionMap.get(typeValue);
		}

		const entityDefinition = new EntityDefinition({
			type: typeValue,
			entityDefinitionsMapCache: this.entityDefinitionMap
		});

		this.entityDefinitionMap.set(typeValue, entityDefinition);
		const relatedEntitiesMap = entityDefinition.getRelatedEntityDefinitionsMap();
		relatedEntitiesMap.forEach((value, key) => this.entityDefinitionMap.set(key, value));

		return entityDefinition;
	}

	getEntityDefinitionMap() {
		return this.entityDefinitionMap;
	}
}
