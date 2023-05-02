/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { DecoratorId, TypeValue } from '@davinci/reflector';
import { UncheckedJSONSchemaType } from './json/types';
import type { EntityDefinition } from './EntityDefinition';
import { CallbackArgs } from './json/JSONSchemaTraverser';

export type JSONSchema<T = any> = UncheckedJSONSchemaType<T, true>;

/**
 * The EntityDefinitionJSONSchema is an extension of the JSONSchema with the added feature of using _$ref to represent connections
 * between related classes. When present, _$ref refers to another instance of the EntityDefinition class.
 */
export type EntityDefinitionJSONSchema<T = any> = JSONSchema<T> & { _$ref?: EntityDefinition };

export type EntityPropOptions<T = unknown> = Partial<JSONSchema<T>> & {
	type?: TypeValue | JSONSchema<T>['type'];
	typeFactory?: () => TypeValue | JSONSchema<T>['type'];
	required?: boolean | string[];
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
) =>
	| {
			path: string;
			value: unknown;
	  }
	| null
	| undefined;
