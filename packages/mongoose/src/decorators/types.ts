/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { SchemaTypeOptions } from 'mongoose';
import { Maybe, TypeValue, TypeValueFactory } from '@davinci/reflector';

export interface IPropDecoratorOptions extends Omit<SchemaTypeOptions<any>, 'type'> {
	typeFactory?: TypeValueFactory;
	type?: TypeValue;
	rawType?: any;
}

export type IPropDecoratorOptionsFactory = () => Maybe<IPropDecoratorOptions>;

export interface IPropDecoratorMetadata {
	key: string;
	optsFactory?: IPropDecoratorOptionsFactory;
}
