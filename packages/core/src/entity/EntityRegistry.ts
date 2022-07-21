/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassType } from '@davinci/reflector';
import { EntityDefinition } from './EntityDefinition';

export class EntityRegistry {
	// entityDefinitions = new Set<EntityDefinition[]>();
	entityDefinitionMap = new Map<ClassType, EntityDefinition>();

	public addEntity(classType: ClassType): EntityDefinition {
		if (this.entityDefinitionMap.has(classType)) {
			return this.entityDefinitionMap.get(classType);
		}

		const entityDefinition = new EntityDefinition({
			type: classType,
			entityDefinitionsMapCache: this.entityDefinitionMap
		});

		this.entityDefinitionMap.set(classType, entityDefinition);
		const relatedEntitiesMap = entityDefinition.getRelatedEntityDefinitionsMap();
		relatedEntitiesMap.forEach((value, key) => this.entityDefinitionMap.set(key, value));

		return entityDefinition;
	}

	getEntityDefinitionMap() {
		return this.entityDefinitionMap;
	}
}
