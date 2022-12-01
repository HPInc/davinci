/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { decorate, DecoratorId } from '@davinci/reflector';
import { Interceptor, InterceptorBagDetails } from './types';

export function interceptor<IBD extends InterceptorBagDetails = InterceptorBagDetails>(handler: Interceptor<IBD>) {
	return decorate(
		{
			[DecoratorId]: 'interceptor',
			handler
		},
		['Class', 'Method'],
		{ allowMultiple: true }
	);
}
