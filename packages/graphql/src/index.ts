import 'reflect-metadata';
import * as generateSchema from './createSchema';
import * as decorators from './decorators';

export const graphql = {
	...generateSchema,
	...decorators
};
