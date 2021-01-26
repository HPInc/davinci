/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { SchemaTypeOptions } from 'mongoose';
import { TypeValueFactory, TypeValue, Maybe } from '@davinci/reflector';

export interface IPropDecoratorOptions extends SchemaTypeOptions<any> {
	typeFactory?: TypeValueFactory;
	type?: TypeValue;
	rawType?: any;
}

export type IPropDecoratorOptionsFactory = () => Maybe<IPropDecoratorOptions>;

export interface IPropDecoratorMetadata {
	key: string;
	optsFactory?: IPropDecoratorOptionsFactory;
}
