/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { DecoratorId } from '@davinci/reflector';

export interface InterceptorBagDetails {
	Context?: unknown;
	State?: unknown;
}

/**
 * Interceptor bag object
 *
 * @typeParam Context - The type of the context that will be injected
 * @typeParam State - The type of the optional state that can be used to propagate state between interceptors
 */
export type InterceptorBag<IBD extends InterceptorBagDetails, AdditionalProps = {}> = {
	module: string;
	handlerArgs: unknown[];
	context?: IBD['Context'];
	state?: IBD['State'];
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
export interface InterceptorDecoratorMeta<Handler extends Interceptor = Interceptor, Meta = unknown> {
	[DecoratorId]: 'interceptor';
	handler: Handler;
	meta?: Meta;
	// meta?: Parameters<I>[1] extends { meta: any } ? Parameters<I>[1]['meta'] : unknown;
}
