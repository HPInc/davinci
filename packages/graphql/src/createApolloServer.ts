import { GraphQLSchema, GraphQLObjectType } from 'graphql';
import { ApolloServer } from 'apollo-server-express';
import { IOfBaseExpress } from '@davinci/core';
import _ from 'lodash';
import { createControllerSchemas } from './createControllerSchemas';
import { ClassType } from './types';

export interface ICreateApolloServerArgs {
	controllers: ClassType[];
	context?: Function | object;
}

export const createApolloServer = (app: IOfBaseExpress, { controllers, context }: ICreateApolloServerArgs) => {
	const allSchemas = { queries: {}, mutations: {}, schemas: {} };
	console.time('create app mutations schemas');
	const { queries: queryFields, mutations: mutationsFields, schemas: controllerSchemas } = (controllers || []).reduce(
		(acc, controller) => {
			_.merge(allSchemas, controllerSchemas);
			const { queries, mutations, schemas } = createControllerSchemas(controller, allSchemas);
			if (queries) {
				acc.queries = _.merge({}, acc.queries || {}, queries);
			}
			if (mutations) {
				acc.mutations = _.merge(acc.mutations || {}, mutations);
			}
			if (schemas) {
				acc.schemas = _.merge(acc.schemas || {}, schemas);
			}
			return acc;
		},
		{ queries: null, mutations: null, schemas: null }
	);

	const schema = new GraphQLSchema({
		query: queryFields
			? new GraphQLObjectType({
					name: 'Query',
					fields: {
						...queryFields
					}
			  })
			: null,
		mutation: mutationsFields
			? new GraphQLObjectType({
					name: 'Mutation',
					fields: {
						...mutationsFields
					}
			  })
			: null
	});

	console.timeEnd('create app mutations schemas');

	console.time('instanciate apolloserver');
	const server = new ApolloServer({
		schema,
		context
	});
	console.timeEnd('instanciate apolloserver');

	console.time('apply apollo middleware');
	server.applyMiddleware({ app });
	console.timeEnd('apply apollo middleware');

	return app;
};

export default createApolloServer;
