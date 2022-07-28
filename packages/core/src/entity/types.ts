/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { DecoratorId, TypeValue } from '@davinci/reflector';
import { UncheckedJSONSchemaType } from './jsonSchemaTypes';

export type JSONSchema<T = any> = UncheckedJSONSchemaType<T, true>;

export type EntityPropOptions<T = unknown> = Partial<JSONSchema<T>> & {
	type?: TypeValue | JSONSchema<T>['type'];
	required?: boolean;
};

export interface EntityPropReflection<T = unknown> {
	[DecoratorId]: 'entity.prop';
	options?: EntityPropOptions<T>;
}

export type EntityOptions = {
	title?: string;
};
