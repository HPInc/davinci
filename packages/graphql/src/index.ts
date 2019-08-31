import 'reflect-metadata';
import * as generateSchema from './generateSchema';
// import * as createQueries from './createQueries';
import * as decorators from './decorators';

export { createControllerSchemas } from './createControllerSchemas';
export { default as createApolloServer } from './createApolloServer';

export const graphql = {
	...generateSchema,
	...decorators
};
