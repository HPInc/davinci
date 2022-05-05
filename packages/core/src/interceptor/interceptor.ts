/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassReflection, DecoratorId, MethodReflection } from '@davinci/reflector';
import { Interceptor, InterceptorBag, InterceptorNext } from './types';

export function getInterceptorsHandlers<Context, State>(
	reflection: MethodReflection | ClassReflection
): Interceptor<Context, State>[] {
	return reflection.decorators.filter(decorator => decorator[DecoratorId] === 'interceptor').map(d => d.handler);
}

export function executeInterceptorsStack<Context, State = Map<string, any>>(
	interceptors: Interceptor<Context, State>[],
	interceptorBag?: InterceptorBag<Context, State>
): ReturnType<InterceptorNext<Context, State>> {
	return interceptors.reverse().reduce(
		(wrapperFunction: InterceptorNext<Context, State>, interceptor) => {
			return () => interceptor(wrapperFunction, interceptorBag);
		},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		() => {}
	)();
}
