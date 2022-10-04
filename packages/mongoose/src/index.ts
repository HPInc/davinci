/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import * as generateModel from './generateModel';
import * as hooks from './hooks';
import * as decorators from './decorators';

export * from './MongooseModule';
export * from './createMongooseController';
export * from './types';
export const mgoose = {
	...generateModel,
	...hooks,
	...decorators
};
