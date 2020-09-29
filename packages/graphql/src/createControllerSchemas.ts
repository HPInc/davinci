/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import _fp from 'lodash/fp';
import _ from 'lodash';
import { GraphQLEnumType, GraphQLList, GraphQLNonNull } from 'graphql';
import { Reflector, ClassType } from '@davinci/reflector';
import Bluebird from 'bluebird';
import generateSchema from './generateSchema';
import { IResolverDecoratorMetadata, OperationType, ResolverMiddleware } from './types';

function applyMiddlewares<TSource, TContext>(...middlewares: ResolverMiddleware<TSource, TContext>[]) {
	const main: ResolverMiddleware<TSource, TContext> = async (root, args, context, info) => {
		const results = await Bluebird.mapSeries(middlewares, middleware => middleware(root, args, context, info));

		return results[results.length - 1];
	};

	return main;
}

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
	const { mutations, schemas: allSchemas } = createResolversAndSchemas(Controller, 'mutations', queriesSchemas);

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
	const contextMetadata = Reflector.getMetadata('davinci:context', TheClass.prototype.constructor);
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
			const { type, name, opts, index } = arg;

			const options = opts || {};
			let graphqlArgType = type;
			if (type === 'context') {
				acc.handlerArgsDefinition.push({ name, index, isContext: true });
				return acc;
			}
			if (type === 'info') {
				acc.handlerArgsDefinition.push({ name, index, isInfo: true });
				return acc;
			}
			if (type === 'selectionSet') {
				acc.handlerArgsDefinition.push({ name, index, isSelectionSet: true });
				return acc;
			}
			if (type === 'parent') {
				acc.handlerArgsDefinition.push({ name, index, isParent: true });
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
					resolverMetadata,
					partial: opts?.partial
				});
				gqlArgType = schema;

				_.merge(allSchemas, theSchemas);
			}

			graphqlArgType = options.required ? new GraphQLNonNull(gqlArgType) : gqlArgType;

			acc.resolverArgs[name] = { type: graphqlArgType };
			acc.handlerArgsDefinition.push({ name, index });
			return acc;
		},
		{ resolverArgs: {}, handlerArgsDefinition: [] }
	);

	// get middlewares
	const allMiddlewaresMeta = (
		Reflector.getMetadata('davinci:graphql:middleware', controller.constructor) || []
	).filter(metadata => metadata.handler === controller[methodName] || metadata.isControllerMw);
	const beforeMiddlewares = allMiddlewaresMeta
		.filter(m => m.stage === 'before')
		.map(({ middlewareFunction }) => middlewareFunction);
	const afterMiddlewares = allMiddlewaresMeta
		.filter(m => m.stage === 'after')
		.map(({ middlewareFunction }) => middlewareFunction);

	const mainResolve = (root, args, context, info) => {
		const handlerArgs = handlerArgsDefinition.reduce((acc, argDefinition) => {
			const { name, index, isContext, isInfo, isSelectionSet, isParent } = argDefinition;
			if (isContext) {
				acc[index] = context;
			}
			if (isInfo) {
				acc[index] = info;
			}
			if (isSelectionSet) {
				acc[index] = getFieldsSelection(info.operation.selectionSet.selections[0], info.returnType.ofType);
			}
			if (isParent) {
				acc[index] = root;
			}

			acc[index] = args?.[name];

			return acc;
		}, []);
		return controller[methodName](...handlerArgs);
	};

	const resolve = applyMiddlewares(...beforeMiddlewares, mainResolve, ...afterMiddlewares);

	const schema = {
		type: graphqlReturnType,
		args: resolverArgs,
		resolve
	};

	return { schema, schemas: allSchemas };
};

export const createResolversAndSchemas = (Controller: ClassType, resolversType: 'queries' | 'mutations', schemas?) => {
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
