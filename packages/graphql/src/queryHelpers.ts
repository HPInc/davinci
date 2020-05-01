/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

// eslint-disable-next-line max-classes-per-file
import _ from 'lodash';
import { Reflector, ClassType } from '@davinci/reflector';
import { field } from './decorators';
import { IFieldDecoratorMetadata } from './types';

const OPERATORS = ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'NIN', 'EXISTS', 'NOT', 'LIMIT', 'SKIP'];
const LOGIC_OPERATORS = ['AND', 'OR', 'NOR'];

const convertToMongodbOperator = (op: typeof OPERATORS[number] | typeof LOGIC_OPERATORS[number]) =>
	`$${_.camelCase(op)}`;

/**
 * Parse a GQL query into a Mongodb compatible query
 * @param query
 * @param path
 */
export const toMongodbQuery = (query, path = '') => {
	return _.reduce(
		query,
		(acc, value, key) => {
			if (OPERATORS.includes(key)) {
				const v = key === 'NOT' ? toMongodbQuery(value, '') : value;
				const queryObj = { [convertToMongodbOperator(key)]: v };
				if (path) {
					acc[path] = queryObj;
					return acc;
				}

				return queryObj;
			}

			if (LOGIC_OPERATORS.includes(key) && Array.isArray(value)) {
				acc[convertToMongodbOperator(key)] = value.map(v => toMongodbQuery(v, path));
				return acc;
			}

			if (typeof value === 'object') {
				return { ...acc, ...toMongodbQuery(value, _.compact([path, key]).join('.')) };
			}

			acc[key] = value;

			return acc;
		},
		{}
	);
};

const removeRegex = /(\[\])/g;
export const toMongdbProjection = (selectionSet: string[] = []) => selectionSet.map(s => s.replace(removeRegex, ''));

const renameClass = (theClass: ClassType, newName: string) => {
	const nameDescriptors = Object.getOwnPropertyDescriptor(theClass, 'name');
	Object.defineProperty(theClass, 'name', { ...nameDescriptors, value: newName });
};

const createFieldFilterOperatorsClass = (type, name: string) => {
	if ([String, Number, Date].includes(type)) {
		class BaseFilterOperators {
			@field({ typeFactory: () => type })
			EQ: any;

			@field({ typeFactory: () => type })
			NE: any;

			@field({ typeFactory: () => type })
			GT: any;

			@field({ typeFactory: () => type })
			GTE: any;

			@field({ typeFactory: () => type })
			LT: any;

			@field({ typeFactory: () => type })
			LTE: any;

			@field({ typeFactory: () => [type] })
			IN: any;

			@field({ typeFactory: () => [type] })
			NIN: any;

			@field()
			EXISTS: boolean;

			@field({ type: BaseFilterOperators })
			NOT: any;
		}

		const newName = _.upperFirst(`${name}Filter`);
		renameClass(BaseFilterOperators, newName);

		return BaseFilterOperators;
	}

	if (Array.isArray(type)) {
		return createFieldFilterOperatorsClass(type[0], name);
	}

	if (typeof type === 'function') {
		const fieldsMetadata = _.map(
			Reflector.getMetadata<IFieldDecoratorMetadata[]>('davinci:graphql:fields', type),
			({ key, opts, optsFactory }) => {
				const options = opts ?? optsFactory({ isInput: false, operationType: 'query' });

				return { key, opts: options };
			}
		);

		const QueryClass = class {};

		fieldsMetadata.forEach(({ key, opts }) => {
			const currentType = opts.typeFactory ? opts.typeFactory() : opts.type;
			const newType = createFieldFilterOperatorsClass(currentType, key);
			const { description, asInput } = opts;
			field({ description, asInput, required: false, type: newType })(QueryClass.prototype, key);
		});
		const newName = _.upperFirst(`${name}Filter`);
		renameClass(QueryClass, newName);

		LOGIC_OPERATORS.forEach(op => field({ typeFactory: () => [QueryClass] })(QueryClass.prototype, op));

		return QueryClass;
	}

	return String;
};

/**
 * Extends a class adding the querying capabilities
 * @param theClass
 * @param name
 */
export const withOperators = (theClass: ClassType, name = theClass.name) => {
	return createFieldFilterOperatorsClass(theClass, name);
};

export const withPagination = () => {
	class BasePaginationOperators {
		@field()
		LIMIT: number;

		@field()
		SKIP: number;
	}

	return class extends BasePaginationOperators {};
};
