/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassType, DecoratorId, reflect, TypeValue, walker } from '@davinci/reflector';
import { entity, EntityPropOptions } from '@davinci/core';
import { capitalizeFirstLetter, isPrimitiveType, renameClass } from './entityManipulationUtils';

const withBaseFilterOperators = (type: TypeValue) => {
	class PrimitiveBaseFilterOperators {
		@entity.prop({ type })
		EQ: any;

		@entity.prop({ type })
		NE: any;

		@entity.prop({ type })
		GT: any;

		@entity.prop({ type })
		GTE: any;

		@entity.prop({ type })
		LT: any;

		@entity.prop({ type })
		LTE: any;

		@entity.prop({ type: [type] })
		IN: any;

		@entity.prop({ type: [type] })
		NIN: any;

		@entity.prop()
		EXISTS: boolean;
	}

	class ObjectBaseFilterOperators extends (type as ClassType) {
		@entity.prop()
		EXISTS: boolean;
	}

	return isPrimitiveType(type) ? PrimitiveBaseFilterOperators : ObjectBaseFilterOperators;
};

export function createWhereSchema<T>(theClass: ClassType<T>, queryablePaths: Array<string> = []) {
	const recurse = (theClass: ClassType<T>, currentPath: string = '') => {
		return walker<ClassType<Partial<T>>>(theClass, meta => {
			if (meta.iterationType === 'class') {
				return { ...meta };
			}

			if (meta.iterationType === 'property') {
				const entityPropDecorator: EntityPropOptions = meta.decorators.find(
					d => d[DecoratorId] === 'entity.prop'
				);

				let type = entityPropDecorator?.options?.type ?? meta.type;
				const isArray = Array.isArray(type);
				type = isArray ? type[0] : type;
				const isPrimitive = isPrimitiveType(type);

				const path = [currentPath, meta.name].filter(t => t).join('.');

				let entityPropOptions: EntityPropOptions;

				if (isPrimitive) {
					const BaseFilter = withBaseFilterOperators(type);
					entityPropOptions = { anyOf: [BaseFilter, type] };
					type = null;
				} else {
					const newClass = reflect.create(
						{},
						{ name: `${capitalizeFirstLetter(type.name)}Query`, extends: type }
					);
					renameClass(newClass, `${capitalizeFirstLetter(type.name)}Query`);
					type = withBaseFilterOperators(recurse(newClass, path));
				}

				if (!queryablePaths.find(p => path.indexOf(p) === 0)) {
					return null;
				}

				return {
					...meta,
					type,
					decorators: meta.decorators.map(d => {
						if (d[DecoratorId] === 'entity.prop') {
							return {
								...d,
								options: {
									...d.options,
									...entityPropOptions,
									type,
									required: false
								}
							};
						}

						return d;
					})
				};
			}

			return null;
		});
	};

	const WhereClass = reflect.create({}, { name: `${theClass.name}WhereBase`, extends: recurse(theClass) });
	entity()(WhereClass);

	const WithQueryClass = reflect.create({}, { name: `${theClass.name}Where`, extends: WhereClass });
	const LOGIC_OPERATORS = ['AND', 'OR', 'NOR'];
	LOGIC_OPERATORS.forEach(op => entity.prop({ type: [WhereClass] })(WithQueryClass.prototype, op));
	entity()(WithQueryClass);

	return WithQueryClass;
}

interface CreateQueryEntityOptions {
	queryablePaths: Array<string>;
	limitMax?: number;
	skipMax?: number;
}

export function createQuerySchema(theClass: ClassType, options: CreateQueryEntityOptions) {
	const defaultOptions: CreateQueryEntityOptions = { queryablePaths: [] };
	const { queryablePaths, limitMax, skipMax } = { ...defaultOptions, ...options };

	class Query {
		@entity.prop({ type: createWhereSchema(theClass, queryablePaths) })
		$where: object;

		@entity.prop({ ...(limitMax ? { maximum: limitMax } : {}) })
		$limit: number;

		@entity.prop({ ...(skipMax ? { maximum: skipMax } : {}) })
		$skip: number;
	}

	return Query;
}
