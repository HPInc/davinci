export { default as generateSchema, generateGQLSchema } from './generateSchema';
import * as decorators from './decorators';
export * from './types';

export { createControllerSchemas } from './createControllerSchemas';
export { default as createGraphQLServer } from './createGraphQLServer';

export const graphql = {
	...decorators
};
