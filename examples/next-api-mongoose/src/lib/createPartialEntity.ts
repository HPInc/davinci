/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassType, DecoratorId, walker } from '@davinci/reflector';

export function createPartialEntity<T>(theClass: ClassType<T>) {
	return walker<ClassType<Partial<T>>>(theClass, meta => {
		if (meta.iterationType === 'class') {
			return { ...meta, name: 'MyCustomer' };
		}

		if (meta.iterationType === 'property') {
			return {
				...meta,
				decorators: meta.decorators.map(d => {
					if (d[DecoratorId] === 'entity.prop') {
						return { ...d, options: { ...d.options, required: false } };
					}

					return d;
				})
			};
		}

		return null;
	});
}
