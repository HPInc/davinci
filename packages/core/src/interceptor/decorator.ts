/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { decorate, DecoratorId } from '@davinci/reflector';
import { Interceptor } from './types';

export function interceptor<Context = unknown, State = unknown>(handler: Interceptor<Context, State>) {
	return decorate(
		{
			[DecoratorId]: 'interceptor',
			handler
		},
		['Class', 'Method'],
		{ allowMultiple: true }
	);
}
