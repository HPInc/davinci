import 'reflect-metadata';
import * as generateModel from './generateModel';
import * as hooks from './hooks';
import * as decorators from './decorators';

export { createMongooseController } from './MongooseController';
export * from './types';
export const mgoose = {
	...generateModel,
	...hooks,
	...decorators
};
