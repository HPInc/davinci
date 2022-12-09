/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { SchemaTypeOptions } from 'mongoose';
import { Maybe, TypeValue, TypeValueFactory } from '@davinci/reflector';

export type IPropDecoratorOptions = SchemaTypeOptions<any> & {
	type?: TypeValue;
	typeFactory?: TypeValueFactory;
	rawType?: any;
};

export type IPropDecoratorOptionsFactory = () => Maybe<IPropDecoratorOptions>;

export interface IPropDecoratorMetadata {
	key: string;
	optsFactory?: IPropDecoratorOptionsFactory;
}
