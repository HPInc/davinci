/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { decorate, DecoratorId } from '@davinci/reflector';
import { EntityOptions, EntityPropOptions } from './types';

export function prop<T = any>(options?: EntityPropOptions<T>) {
	return decorate(
		{
			[DecoratorId]: 'entity.prop',
			options
		},
		['Property'],
		{ allowMultiple: false, inherit: true }
	);
}

export function entity(options?: EntityOptions) {
	return decorate(
		{
			[DecoratorId]: 'entity',
			options
		},
		['Class'],
		{ allowMultiple: false, inherit: true }
	);
}

entity.prop = prop;
