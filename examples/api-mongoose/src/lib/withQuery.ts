/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassType } from '@davinci/reflector';
import { entity } from '@davinci/core';
import { createWhereSchema } from './createWhereSchema';

export function withQuery(theClass: ClassType, queryablePaths: Array<string> = []) {
	const whereType = createWhereSchema(theClass, queryablePaths);

	class Query {
		@entity.prop({ type: whereType })
		$where: object;

		@entity.prop()
		$limit: number;

		@entity.prop()
		$skip: number;
	}

	return Query;
}
