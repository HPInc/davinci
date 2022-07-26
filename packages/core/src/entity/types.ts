/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { DecoratorId, TypeValue } from '@davinci/reflector';
import { UncheckedJSONSchemaType } from './jsonSchemaTypes';

export type JSONSchema<T = any> = UncheckedJSONSchemaType<T, true>;

export type EntityPropOptions<T = unknown> = {
	type?: TypeValue | UncheckedJSONSchemaType<T, true>['type'];
	required?: boolean;
	jsonSchema?: Partial<UncheckedJSONSchemaType<T, true>>;
};

export interface EntityPropReflection<T = unknown> {
	[DecoratorId]: 'entity.prop';
	options?: EntityPropOptions<T>;
}

export type EntityOptions = {
	title?: string;
};
