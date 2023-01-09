/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { DecoratorId } from '@davinci/reflector';

export interface InterceptorBagDetails {
	Context?: unknown;
	State?: unknown;
	Meta?: unknown;
}

/**
 * Interceptor bag object
 *
 * @typeParam Context - The type of the context that will be injected
 * @typeParam State - The type of the optional state that can be used to propagate state between interceptors
 */
export type InterceptorBag<IBD extends InterceptorBagDetails = InterceptorBagDetails, AdditionalProps = {}> = {
	module: string;
	handlerArgs: unknown[];
	context?: IBD['Context'];
	state?: IBD['State'];
	meta?: IBD['Meta'];
} & AdditionalProps;

/**
 * Interceptor function
 *
 * @typeParam Context - The type of the context that will be injected
 * @typeParam State - The type of the optional state that can be used to propagate state between interceptors
 */
export type Interceptor<IBD extends InterceptorBagDetails = InterceptorBagDetails, AdditionalProps = {}> = (
	// eslint-disable-next-line no-use-before-define
	next: InterceptorNext<IBD, AdditionalProps>,
	interceptorBag?: InterceptorBag<IBD, AdditionalProps>
) => any;

/**
 * Interceptor next function
 *
 * @typeParam Context - The type of the context that will be injected
 * @typeParam State - The type of the optional state that can be used to propagate state between interceptors
 */
export type InterceptorNext<
	IBD extends InterceptorBagDetails = InterceptorBagDetails,
	AdditionalProps = {}
> = () => ReturnType<Interceptor<IBD, AdditionalProps>>;

/**
 * Interceptor decorator metadata
 */
export interface InterceptorDecoratorMeta<I extends Interceptor = Interceptor> {
	[DecoratorId]: 'interceptor';
	handler: I;
	meta?: Parameters<I>[1] extends { meta: unknown } ? Parameters<I>[1]['meta'] : unknown;
}
