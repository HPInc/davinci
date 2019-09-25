export { default as generateSchema, generateGQLSchema } from './generateSchema';
// import * as createQueries from './createQueries';
import * as decorators from './decorators';

export { createControllerSchemas } from './createControllerSchemas';
export { default as createGraphQLServer } from './createGraphQLServer';

export const graphql = {
	...decorators
};
