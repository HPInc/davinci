import { GraphQLSchema, GraphQLObjectType } from 'graphql';
import { ApolloServer } from 'apollo-server-express';
import _ from 'lodash';
import { createResolver } from './createQueriesAndResolvers';

export const createApolloServer = (app, { controllers }) => {
	const { queries: queryFields, mutations: mutationsFields } = (controllers || []).reduce(
		(acc, controller) => {
			const { queries, mutations } = createResolver(controller);
			if (queries) {
				acc.queries = _.merge({}, acc.queries || {}, queries);
			}
			if (mutations) {
				acc.mutations = _.merge(acc.mutations || {}, mutations);
			}
			return acc;
		},
		{ queries: null, mutations: null }
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
	const server = new ApolloServer({ schema });

	server.applyMiddleware({ app });

	return app;
};

export default createApolloServer;
