/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassReflection, DecoratorId, MethodReflection } from '@davinci/reflector';
import {
	Interceptor,
	InterceptorBag,
	InterceptorBagGenerics,
	InterceptorDecoratorMeta,
	InterceptorNext
} from './types';

export function getInterceptorsDecorators<I extends Interceptor = Interceptor, Meta = unknown>(
	reflection: MethodReflection | ClassReflection
): Array<InterceptorDecoratorMeta<I, Meta>> {
	return reflection.decorators.filter(decorator => decorator[DecoratorId] === 'interceptor');
}

export function getInterceptorsHandlers<I extends Interceptor = Interceptor>(
	reflection: MethodReflection | ClassReflection
): Array<I> {
	return reflection.decorators.filter(decorator => decorator[DecoratorId] === 'interceptor').map(d => d.handler);
}

export function executeInterceptorsStack<IBD extends InterceptorBagGenerics = InterceptorBagGenerics>(
	interceptors: Interceptor<IBD>[],
	interceptorBag: InterceptorBag<IBD>
): ReturnType<InterceptorNext<IBD>> {
	return interceptors.reverse().reduce(
		(wrapperFunction: InterceptorNext<IBD>, interceptor) => {
			return () => interceptor(wrapperFunction, interceptorBag);
		},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		() => {}
	)();
}
