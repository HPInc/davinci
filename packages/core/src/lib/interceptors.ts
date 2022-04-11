/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

// eslint-disable-next-line no-use-before-define
export type Interceptor<Arguments> = (next: InterceptorNext<Arguments>, args?: Arguments) => any;
export type InterceptorNext<Arguments> = () => ReturnType<Interceptor<Arguments>>;

export function executeInterceptorsStack<Arguments>(
	interceptors: Interceptor<Arguments>[],
	initialArguments?: Arguments
): ReturnType<InterceptorNext<Arguments>> {
	return interceptors.reverse().reduce(
		(wrapperFunction: InterceptorNext<Arguments>, interceptor) => {
			return () => interceptor(wrapperFunction, initialArguments);
		},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		() => {}
	)();
}
