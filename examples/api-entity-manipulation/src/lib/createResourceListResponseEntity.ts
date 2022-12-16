/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassType, DecoratorId, reflect } from '@davinci/reflector';
import { entity, EntityOptions } from '@davinci/core';

export function createResourceListResponseEntity<T>(entityClass: ClassType<T>) {
	const reflection = reflect(entityClass);
	const entityDecorator: { options: EntityOptions } = reflection.decorators.find(d => d[DecoratorId] === 'entity');
	const entityName = entityDecorator?.options?.name ?? reflection.name;

	@entity({ name: `${entityName}ListResponse` })
	class ResourceListResponse {
		@entity.prop({ type: [entityClass] })
		data: Array<T>;
	}

	return ResourceListResponse;
}
