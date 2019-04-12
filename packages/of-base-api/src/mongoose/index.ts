import * as generateModel from './generateModel';
import * as hooks from './hooks';
import * as decorators from './decorators';

export const mgoose = {
	...generateModel,
	...hooks,
	...decorators
};
