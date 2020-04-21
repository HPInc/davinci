import _ from 'lodash';
import { Reflector, ClassType } from '@davinci/reflector';
import { field } from './decorators';
import { IFieldDecoratorMetadata } from './types';

const OPERATORS = ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'NIN', 'EXISTS'];
const LOGIC_OPERATORS = ['AND', 'OR'];

const toMgooseQuerySyntax = (op: typeof OPERATORS[number] | typeof LOGIC_OPERATORS[number]) => `$${_.camelCase(op)}`;

export const parseGqlQuery = (query, path = '') => {
	return _.reduce(
		query,
		(acc, value, key) => {
			if (OPERATORS.includes(key)) {
				acc[path] = { [toMgooseQuerySyntax(key)]: value };
				return acc;
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
		}

		const nameDescriptors = Object.getOwnPropertyDescriptor(BaseFilterOperators, 'name');
		const newName = _.upperFirst(`${name}Query`);
		Object.defineProperty(BaseFilterOperators, 'name', { ...nameDescriptors, value: newName });

		return BaseFilterOperators;
	}

	if (Array.isArray(type)) {
		return createFieldFilterOperatorsClass(type[0], name);
	}

	if (typeof type === 'function') {
		return type;
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

	const AndClass = class extends QueryClass {};
	field({ typeFactory: () => [AndClass] })(QueryClass.prototype, 'AND');
	field({ typeFactory: () => [AndClass] })(QueryClass.prototype, 'OR');

	const andFieldsMeta = (Reflector.getMetadata(
		'davinci:graphql:fields',
		AndClass
	) as IFieldDecoratorMetadata[]).filter(({ key }) => !['AND', 'OR'].includes(key));
	Reflector.defineMetadata('davinci:graphql:fields', andFieldsMeta, AndClass);

	return QueryClass;
};
