/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassReflection, DecoratorId, MethodReflection } from '@davinci/reflector';
import { Interceptor, InterceptorBag, InterceptorBagDetails, InterceptorDecoratorMeta, InterceptorNext } from './types';

export function getInterceptorsDecorators<I extends Interceptor = Interceptor>(
	reflection: MethodReflection | ClassReflection
): Array<InterceptorDecoratorMeta<I>> {
	return reflection.decorators.filter(decorator => decorator[DecoratorId] === 'interceptor');
}

export function getInterceptorsHandlers<I extends Interceptor = Interceptor>(
	reflection: MethodReflection | ClassReflection
): Array<I> {
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
