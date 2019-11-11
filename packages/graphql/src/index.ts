import * as decorators from './decorators';

export { default as generateSchema, generateGQLSchema } from './generateSchema';
export * from './types';

export { createControllerSchemas } from './createControllerSchemas';
export { default as createGraphQLServer } from './createGraphQLServer';

export const graphql = {
	...decorators
};
