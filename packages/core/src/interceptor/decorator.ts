/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { decorate, DecoratorId } from '@davinci/reflector';
import { Interceptor } from './types';

export function interceptor<ModuleInterceptorBag>(handler: Interceptor<ModuleInterceptorBag>) {
	return decorate(
		{
			[DecoratorId]: 'interceptor',
			handler
		},
		['Class', 'Method'],
		{ allowMultiple: true }
	);
}
