import { GraphQLSchema, GraphQLObjectType, printSchema } from 'graphql';
import graphqlHTTP from 'express-graphql';
import { IOfBaseExpress } from '@davinci/core';
import fs from 'fs';
import _ from 'lodash';
import { createControllerSchemas } from './createControllerSchemas';
import { ClassType } from './types';
import playground from './pl';

export interface ICreateApolloServerOptions {
	controllers: ClassType[];
	context?: Function | object;
	graphqlEndpoint?: string;
	graphqlOptions?: any;
	playgroundEnabled?: boolean;
	playgroundOptions?: any;
}

const DEFAULT_OPTIONS: ICreateApolloServerOptions = {
	controllers: [],
	graphqlEndpoint: '/graphql',
	graphqlOptions: {},
	playgroundEnabled: true,
	playgroundOptions: { shareEnabled: true }
};

export const createGraphQLServer = (app: IOfBaseExpress, options: ICreateApolloServerOptions) => {
	const {
		controllers,
		context,
		graphqlEndpoint,
		graphqlOptions,
		playgroundEnabled,
		playgroundOptions
	} = _.merge({}, DEFAULT_OPTIONS, options);

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

	if (playgroundEnabled) {
		// tslint:disable-next-line:variable-name
		app.get(graphqlEndpoint, (_req, res) => res.send(playground(playgroundOptions)));
	}

	app.use(
		graphqlEndpoint,
		graphqlHTTP({
			schema,
			graphiql: false,
			context,
			...graphqlOptions
		})
	);
	console.info(`--- 🚀 GraphQL running on ${graphqlEndpoint}`);

	if (playgroundEnabled) {
		console.info(`--- 🛹 GraphQL Playground on ${graphqlEndpoint}`);
	}

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

export default createGraphQLServer;
