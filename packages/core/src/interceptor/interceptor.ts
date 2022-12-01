/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassReflection, DecoratorId, MethodReflection } from '@davinci/reflector';
import { Interceptor, InterceptorBag, InterceptorBagDetails, InterceptorNext } from './types';

export function getInterceptorsHandlers<
	IBD extends InterceptorBagDetails = InterceptorBagDetails,
	AdditionalProps = {}
>(reflection: MethodReflection | ClassReflection): Interceptor<IBD, AdditionalProps>[] {
	return reflection.decorators.filter(decorator => decorator[DecoratorId] === 'interceptor').map(d => d.handler);
}

export function executeInterceptorsStack<
	IBD extends InterceptorBagDetails = InterceptorBagDetails,
	AdditionalProps = {}
>(
	interceptors: Interceptor<IBD, AdditionalProps>[],
	interceptorBag?: InterceptorBag<IBD, AdditionalProps>
): ReturnType<InterceptorNext<IBD, AdditionalProps>> {
	return interceptors.reverse().reduce(
		(wrapperFunction: InterceptorNext<IBD, AdditionalProps>, interceptor) => {
			return () => interceptor(wrapperFunction, interceptorBag);
		},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		() => {}
	)();
}
