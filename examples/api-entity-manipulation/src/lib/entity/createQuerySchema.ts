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
		$eq: any;

		@entity.prop({ type })
		$ne: any;

		@entity.prop({ type })
		$gt: any;

		@entity.prop({ type })
		$gte: any;

		@entity.prop({ type })
		$lt: any;

		@entity.prop({ type })
		$lte: any;

		@entity.prop({ type: [type] })
		$in: any;

		@entity.prop({ type: [type] })
		$nin: any;

		@entity.prop()
		$exists: boolean;
	}

	class ObjectBaseFilterOperators extends (type as ClassType) {
		@entity.prop()
		$exists: boolean;
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
	const LOGIC_OPERATORS = ['$and', '$or'];
	LOGIC_OPERATORS.forEach(op => entity.prop({ type: [WhereClass] })(WithQueryClass.prototype, op));
	entity()(WithQueryClass);

	return WithQueryClass;
}

interface CreateQueryEntityOptions {
	queryablePaths?: Array<string>;
	populatePaths?: Array<{ path: string; options: CreateQueryEntityOptions }>;
	sortablePaths?: Array<{ path: string; order: Array<1 | -1> }>;
	limitMax?: number;
	skipMax?: number;
}

export function createQuerySchema(theClass: ClassType, options: CreateQueryEntityOptions) {
	const defaultOptions: CreateQueryEntityOptions = { queryablePaths: [], sortablePaths: [] };
	const { queryablePaths, sortablePaths, limitMax, skipMax } = { ...defaultOptions, ...options };

	class Query {
		@entity.prop({ type: createWhereSchema(theClass, queryablePaths) })
		$where: object;

		@entity.prop({
			type: false,
			anyOf: [
				{ type: 'object', patternProperties: { '.*': { type: 'number', enum: [1, -1] } } },
				{ type: 'array', items: { type: 'string' } }
			]
		})
		$select: Record<string, 1 | -1> | Array<string>;

		$sort: Record<string, 1 | -1> | Array<string>;

		@entity.prop({ ...(limitMax ? { maximum: limitMax } : {}) })
		$limit: number;

		@entity.prop({ ...(skipMax ? { maximum: skipMax } : {}) })
		$skip: number;
	}

	if (sortablePaths.length) {
		entity.prop({
			type: 'object',
			properties: sortablePaths.reduce(
				(acc, field) => ({
					...acc,
					[field.path]: { type: 'number', enum: field.order }
				}),
				{}
			)
		})(Query.prototype, '$sort');
	}

	return Query;
}
