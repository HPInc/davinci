/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassReflection, DecoratorId, MethodReflection } from '@davinci/reflector';
import { Interceptor, InterceptorBag, InterceptorNext } from './types';

export function getInterceptorsHandlers<ModuleInterceptorBag>(
	reflection: MethodReflection | ClassReflection
): Interceptor<ModuleInterceptorBag>[] {
	return reflection.decorators.filter(decorator => decorator[DecoratorId] === 'interceptor').map(d => d.handler);
}

export function executeInterceptorsStack<ModuleInterceptorBag = Map<string, any>>(
	interceptors: Interceptor<ModuleInterceptorBag>[],
	interceptorBag?: InterceptorBag<ModuleInterceptorBag>
): ReturnType<InterceptorNext<ModuleInterceptorBag>> {
	return interceptors.reverse().reduce(
		(wrapperFunction: InterceptorNext<ModuleInterceptorBag>, interceptor) => {
			return () => interceptor(wrapperFunction, interceptorBag);
		},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		() => {}
	)();
}
