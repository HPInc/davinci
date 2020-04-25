import { GraphQLSchema, GraphQLObjectType, printSchema } from 'graphql';
import graphqlHTTP from 'express-graphql';
import { ClassType } from '@davinci/reflector';
import { DaVinciExpress } from '@davinci/core';
import fs from 'fs';
import _ from 'lodash';
import { createControllerSchemas } from './createControllerSchemas';
import playground from './playground-markup';

export interface ICreateGraphQLServerOptions {
	context?: Function | object;
	graphqlEndpoint?: string;
	graphqlOptions?: graphqlHTTP.Options;
	playgroundEnabled?: boolean;
	playgroundOptions?: any;
}

const DEFAULT_OPTIONS: ICreateGraphQLServerOptions = {
	graphqlEndpoint: '/graphql',
	playgroundEnabled: true,
	playgroundOptions: { shareEnabled: true }
};

/**
 * It adds a graphql server to an existing express app
 * @param app - Express app instance
 * @param controllers - Array of controllers
 * @param options
 * @param options.context - The context that will be passed to the request handlers
 * if the context param decorator is used
 * @param options.graphqlEndpoint - The endpoint where the graphql server will be listening for new API requests
 * @param options.graphqlOptions - Additional options passed to the graphql server
 * @param options.playgroundEnabled - If true, the playground UI will be available
 * to browser at the {graphqlEndpoint} address
 * @param options.playgroundEnabled - Additional options passed to the playground UI
 */
export const createGraphQLServer = (
	app: DaVinciExpress,
	controllers: ClassType[],
	options?: ICreateGraphQLServerOptions
) => {
	const { context, graphqlEndpoint, graphqlOptions, playgroundEnabled, playgroundOptions } = _.merge(
		{},
		DEFAULT_OPTIONS,
		options
	);

	const allSchemas = { queries: {}, mutations: {}, schemas: {} };
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
		graphqlHTTP(request => ({
			schema,
			graphiql: false,
			context: typeof context === 'function' ? context(request) : context,
			...(graphqlOptions || {})
		}))
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
