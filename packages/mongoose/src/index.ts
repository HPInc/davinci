import 'reflect-metadata';
import * as generateModel from './generateModel';
import * as hooks from './hooks';
import * as decorators from './decorators';

export { default as MongooseController } from './MongooseController';
export const mgoose = {
	...generateModel,
	...hooks,
	...decorators
};
