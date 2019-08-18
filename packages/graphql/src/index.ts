import 'reflect-metadata';
import * as generateSchema from './generateSchema';
// import * as createQueries from './createQueries';
import * as decorators from './decorators';

export const graphql = {
	...generateSchema,
	...decorators
};
