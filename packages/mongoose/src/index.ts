import * as generateModel from './generateModel';
import * as hooks from './hooks';
import * as decorators from './decorators';

export * from './createMongooseController';
export * from './types';
export const mgoose = {
	...generateModel,
	...hooks,
	...decorators
};
