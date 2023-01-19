/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { DecoratorId } from '@davinci/reflector';

export interface InterceptorBagGenerics {
	Context?: any;
	State?: any;
	Meta?: any;
	Additional?: any;
}

/**
 * Interceptor bag object
 *
 * @typeParam Context - The type of the context that will be injected
 * @typeParam State - The type of the optional state that can be used to propagate state between interceptors
 */
export type InterceptorBag<IBD extends InterceptorBagGenerics> = {
	module: string;
	handlerArgs: unknown[];
	context?: IBD['Context'];
	state?: IBD['State'];
	meta?: IBD['Meta'];
} & IBD['Additional'];

/**
 * Interceptor function
 *
 * @typeParam Context - The type of the context that will be injected
 * @typeParam State - The type of the optional state that can be used to propagate state between interceptors
 */
export type Interceptor<IBD extends InterceptorBagGenerics = InterceptorBagGenerics> = (
	// eslint-disable-next-line no-use-before-define
	next: InterceptorNext<IBD>,
	interceptorBag: InterceptorBag<IBD>
) => any;

/**
 * Interceptor next function
 *
 * @typeParam Context - The type of the context that will be injected
 * @typeParam State - The type of the optional state that can be used to propagate state between interceptors
 */
export type InterceptorNext<IBD extends InterceptorBagGenerics = InterceptorBagGenerics> = () => ReturnType<
	Interceptor<IBD>
>;

/**
 * Interceptor decorator metadata
 */
export interface InterceptorDecoratorMeta<Handler extends Interceptor = Interceptor, Meta = unknown> {
	[DecoratorId]: 'interceptor';
	handler: Handler;
	meta?: Meta;
}
