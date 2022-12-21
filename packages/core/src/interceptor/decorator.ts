/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { decorate, DecoratorId } from '@davinci/reflector';
import { Interceptor, InterceptorDecoratorMeta } from './types';

export function interceptor<I extends Interceptor = Interceptor>(handler: I, meta?: Parameters<I>[1]['meta']) {
	const options: InterceptorDecoratorMeta = {
		[DecoratorId]: 'interceptor',
		handler
	};

	if (meta) {
		options.meta = meta;
	}

	return decorate(options, ['Class', 'Method'], { allowMultiple: true });
}
