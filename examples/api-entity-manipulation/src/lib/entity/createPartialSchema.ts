/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassType, DecoratorId, reflect, walker } from '@davinci/reflector';
import { capitalizeFirstLetter, isPrimitiveType, renameClass } from './entityManipulationUtils';

export function createPartialSchema<T>(theClass: ClassType<T>) {
	return walker<ClassType<Partial<T>>>(theClass, meta => {
		if (meta.iterationType === 'class') {
			return { ...meta };
		}

		if (meta.iterationType === 'property') {
			const entityPropDecorator = meta.decorators.find(d => d[DecoratorId] === 'entity.prop');

			let type = entityPropDecorator?.options?.type ?? meta.type;
			const isArray = Array.isArray(type);
			type = isArray ? type[0] : type;
			if (isArray) {
				// console.log('isArray')
			}

			if (!isPrimitiveType(type)) {
				const newClass = reflect.create(
					{},
					{ name: `${capitalizeFirstLetter(type.name)}Partial`, extends: type }
				);
				renameClass(newClass, `${capitalizeFirstLetter(type.name)}Partial`);
				type = createPartialSchema(newClass);
				// console.log(type.name)
			}

			return {
				...meta,
				type: isArray ? [type] : type,
				decorators: meta.decorators.map(d => {
					if (d[DecoratorId] === 'entity.prop') {
						return { ...d, options: { ...d.options, type: isArray ? [type] : type, required: false } };
					}

					return d;
				})
			};
		}

		return null;
	});
}
