/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { DecoratorId, TypeValue } from '@davinci/reflector';
import { UncheckedJSONSchemaType } from './jsonSchemaTypes';
import type { EntityDefinition } from './EntityDefinition';
import { CallbackArgs } from './JSONSchemaTraverser';

export type JSONSchema<T = any> = UncheckedJSONSchemaType<T, true>;

export type EntityDefinitionJSONSchema<T = any> = JSONSchema<T> & { _$ref?: EntityDefinition };

export type EntityPropOptions<T = unknown> = Partial<JSONSchema<T>> & {
	type?: TypeValue | JSONSchema<T>['type'];
	required?: boolean;
};

export interface EntityPropReflection<T = unknown> {
	[DecoratorId]: 'entity.prop';
	options?: EntityPropOptions<T>;
}

export type EntityOptions = {
	name?: string;
};

export type TransformEntityDefinitionSchemaCallback = (
	args: CallbackArgs & { pointerPath: string; pointerPathParts: string[] }
) => {
	path: string;
	value: unknown;
};
