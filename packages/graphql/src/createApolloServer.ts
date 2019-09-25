import { GraphQLSchema, GraphQLObjectType, printSchema } from 'graphql';
import { ApolloServer } from 'apollo-server-express';
import { IOfBaseExpress } from '@davinci/core';
import fs from 'fs';
import _ from 'lodash';
import { createControllerSchemas } from './createControllerSchemas';
import { ClassType } from './types';

export interface ICreateApolloServerArgs {
	controllers: ClassType[];
	context?: Function | object;
}

export const createApolloServer = (
	app: IOfBaseExpress,
	{ controllers, context }: ICreateApolloServerArgs
) => {
	const allSchemas = { queries: {}, mutations: {}, schemas: {} };
	const { queries: queryFields, mutations: mutationsFields, schemas: controllerSchemas } = (
		controllers || []
	).reduce(
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
		mutation: !_.isEmpty(mutationsFields)
			? new GraphQLObjectType({
					name: 'Mutation',
					fields: {
						...mutationsFields
					}
			  })
			: null
	});

	const server = new ApolloServer({
		schema,
		context
	});

	server.applyMiddleware({ app });

	const printSDL = () => printSchema(schema);

	const writeSDLtoFile = async path => {
		const sdl = printSDL();
		return new Promise((resolve, reject) =>
			fs.writeFile(path, sdl, err => {
				if (err) return reject(err);

				return resolve();
			})
		);
	};

	return { app, schema, printSDL, writeSDLtoFile };
};

export default createApolloServer;
