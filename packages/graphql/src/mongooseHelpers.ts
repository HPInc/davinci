import _ from 'lodash';
import { Reflector, ClassType } from '@davinci/reflector';
import { field } from './decorators';
import { IFieldDecoratorMetadata } from './types';

const OPERATORS = ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'NIN', 'EXISTS', 'NOT'];
const LOGIC_OPERATORS = ['AND', 'OR', 'NOR'];

const toMgooseQuerySyntax = (op: typeof OPERATORS[number] | typeof LOGIC_OPERATORS[number]) => `$${_.camelCase(op)}`;

export const parseGqlQuery = (query, path = '') => {
	return _.reduce(
		query,
		(acc, value, key) => {
			if (OPERATORS.includes(key)) {
				const v = key === 'NOT' ? parseGqlQuery(value, '') : value;
				const queryObj = { [toMgooseQuerySyntax(key)]: v };
				if (path) {
					acc[path] = queryObj;
					return acc;
				}

				return queryObj;
			}

			if (LOGIC_OPERATORS.includes(key) && Array.isArray(value)) {
				acc[toMgooseQuerySyntax(key)] = value.map(v => parseGqlQuery(v, path));
				return acc;
			}

			if (typeof value === 'object') {
				return { ...acc, ...parseGqlQuery(value, _.compact([path, key]).join('.')) };
			}

			acc[key] = value;

			return acc;
		},
		{}
	);
};

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

		const newName = _.upperFirst(`${name}Query`);
		renameClass(BaseFilterOperators, newName);

		return BaseFilterOperators;
	}

	if (Array.isArray(type)) {
		return createFieldFilterOperatorsClass(type[0], name);
	}

	if (typeof type === 'function') {
		const fieldsMetadata = _.map(
			Reflector.getMetadata('davinci:graphql:fields', type) as IFieldDecoratorMetadata[],
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
		const newName = _.upperFirst(`${name}Query`);
		renameClass(QueryClass, newName);

		return QueryClass;
	}

	return String;
};

export const withOperators = (theClass: ClassType) => {
	const fieldsMetadata = _.map(
		Reflector.getMetadata('davinci:graphql:fields', theClass) as IFieldDecoratorMetadata[],
		({ key, opts, optsFactory }) => {
			const options = opts ?? optsFactory({ isInput: false, operationType: 'query' });

			return { key, opts: options };
		}
	);

	const QueryClass = class {};

	fieldsMetadata.forEach(({ key, opts }) => {
		const type = opts.typeFactory ? opts.typeFactory() : opts.type;
		const newType = createFieldFilterOperatorsClass(type, key);
		const { description, asInput } = opts;
		field({ description, asInput, required: false, type: newType })(QueryClass.prototype, key);
	});

	LOGIC_OPERATORS.forEach(op => field({ typeFactory: () => [QueryClass] })(QueryClass.prototype, op));

	return QueryClass;
};
