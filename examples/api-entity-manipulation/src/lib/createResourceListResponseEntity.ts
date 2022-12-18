/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassType } from '@davinci/reflector';
import { entity } from '@davinci/core';

export function createResourceListResponseEntity<T>(entityClass: ClassType<T>) {
	class ResourceListResponse {
		@entity.prop({ type: [entityClass] })
		data: Array<T>;
	}

	return ResourceListResponse;
}
