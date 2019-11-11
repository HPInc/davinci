import _fp from 'lodash/fp';
import _ from 'lodash';
import { GraphQLEnumType, GraphQLList, GraphQLNonNull } from 'graphql';
import { Reflector, ClassType } from '@davinci/reflector';
import generateSchema from './generateSchema';
import { IResolverDecoratorMetadata, OperationType } from './types';

/**
 * Returns a flatten list of fields
 * @param fieldASTs
 * @param returnType
 * @param basePath
 */
export function getFieldsSelection(fieldASTs, returnType, basePath?: string) {
	const { selections } = fieldASTs.selectionSet;
	return selections.reduce((projs, selection) => {
		const fieldName = selection.name.value;
		const isParentList = returnType instanceof GraphQLList;
		const fieldReturnType = (returnType.ofType || returnType).getFields()[fieldName].type;
		const pathSuffix = isParentList ? '[]' : '';
		const fieldPath = _.compact([`${basePath || ''}${pathSuffix}`, fieldName]).join('.');
		if (selection.selectionSet) {
			return [...projs, ...getFieldsSelection(selection, fieldReturnType, fieldPath)];
		}
		return [...projs, fieldPath];
	}, []);
}

/**
 * Given a controller class it returns queries, mutations and type schemas
 * @param Controller
 * @param {queries, mutations, schemas}
 */
export const createControllerSchemas = (
	Controller: ClassType,
	{ queries: q, mutations: m, schemas: s } = { queries: {}, mutations: {}, schemas: {} }
) => {
	// eslint-disable-next-line @typescript-eslint/no-use-before-define
	const { queries, schemas: queriesSchemas } = createResolversAndSchemas(Controller, 'queries', s);
	// eslint-disable-next-line @typescript-eslint/no-use-before-define
	const { mutations, schemas: allSchemas } = createResolversAndSchemas(
		Controller,
		'mutations',
		queriesSchemas
	);

	return { queries: { ...q, ...queries }, mutations: { ...m, ...mutations }, schemas: allSchemas };
};

/**
 * Given a controller class it returns queries, mutations and type schemas
 * @param TheClass
 * @param resolverMetadata
 * @param schemas
 * @param operationType
 */
export const createExecutableSchema = (
	TheClass,
	resolverMetadata: IResolverDecoratorMetadata,
	schemas,
	operationType: OperationType
) => {
	const { methodName, returnType } = resolverMetadata;
	const contextMetadata = Reflector.getMetadata('tscontroller:context', TheClass.prototype.constructor);
	const resolverArgsMetadata = _fp.flow(
		_fp.concat(contextMetadata),
		_fp.filter({ methodName }),
		_fp.sortBy('index'),
		_fp.compact
	)(Reflector.getMetadata('davinci:graphql:args', TheClass.prototype.constructor) || []);

	const allSchemas = schemas || {};
	const controller = new TheClass();

	const { schema: graphqlReturnType, schemas: s } = generateSchema({
		type: returnType,
		schemas: allSchemas,
		operationType,
		resolverMetadata
	});
	_.merge(allSchemas, s);

	const { resolverArgs, handlerArgsDefinition } = resolverArgsMetadata.reduce(
		(acc, arg: any) => {
			const { type, name, opts } = arg;

			const options = opts || {};
			let graphqlArgType = type;
			if (type === 'context') {
				acc.handlerArgsDefinition.push({ name, isContext: true });
				return acc;
			}
			if (type === 'info') {
				acc.handlerArgsDefinition.push({ name, isInfo: true });
				return acc;
			}
			if (type === 'selectionSet') {
				acc.handlerArgsDefinition.push({ name, isSelectionSet: true });
				return acc;
			}
			if (type === 'parent') {
				acc.handlerArgsDefinition.push({ name, isParent: true });
				return acc;
			}

			let gqlArgType;
			if (options.enum) {
				if (schemas[name]) {
					gqlArgType = schemas[name];
				} else {
					schemas[name] = new GraphQLEnumType({
						name,
						values: _.mapValues(options.enum, value => ({ value }))
					});
					gqlArgType = schemas[name];
				}
			} else {
				const { schema, schemas: theSchemas } = generateSchema({
					type,
					schemas: allSchemas,
					isInput: true,
					operationType,
					resolverMetadata
				});
				gqlArgType = schema;

				_.merge(allSchemas, theSchemas);
			}

			graphqlArgType = options.required ? new GraphQLNonNull(gqlArgType) : gqlArgType;

			acc.resolverArgs[name] = { type: graphqlArgType };
			acc.handlerArgsDefinition.push({ name });
			return acc;
		},
		{ resolverArgs: {}, handlerArgsDefinition: [] }
	);

	const schema = {
		type: graphqlReturnType,
		args: resolverArgs,
		resolve(root, args, context, info) {
			const handlerArgs = handlerArgsDefinition.map(argDefinition => {
				const { name, isContext, isInfo, isSelectionSet, isParent } = argDefinition;
				if (isContext) return context;
				if (isInfo) return info;
				if (isSelectionSet) {
					return getFieldsSelection(
						info.operation.selectionSet.selections[0],
						info.returnType.ofType
					);
				}
				if (isParent) return root;

				return (args || {})[name];
			});
			return controller[methodName](...handlerArgs);
		}
	};

	return { schema, schemas: allSchemas };
};

export const createResolversAndSchemas = (
	Controller: ClassType,
	resolversType: 'queries' | 'mutations',
	schemas?
) => {
	const resolversMetadata =
		Reflector.getMetadata(`davinci:graphql:${resolversType}`, Controller.prototype.constructor) || [];

	const allSchemas = schemas || {};
	const operationType = resolversType === 'queries' ? 'query' : 'mutation';

	const resolvers = resolversMetadata.reduce((acc, query) => {
		const { methodName, name } = query;
		const { schema, schemas: theSchemas } = createExecutableSchema(Controller, query, allSchemas, operationType);
		_.merge(allSchemas, theSchemas);
		acc[name || methodName] = schema;

		return acc;
	}, {});

	return { [resolversType]: resolvers, schemas: allSchemas };
};

export default createControllerSchemas;
