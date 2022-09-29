/**
 * Interceptor bag object
 *
 * @typeParam Context - The type of the context that will be injected
 * @typeParam State - The type of the optional state that can be used to propagate state between interceptors
 */
export type InterceptorBag<Context = unknown, State = unknown> = {
	module: string;
	handlerArgs: unknown[];
	context?: Context;
	state?: State;
};

/**
 * Interceptor function
 *
 * @typeParam Context - The type of the context that will be injected
 * @typeParam State - The type of the optional state that can be used to propagate state between interceptors
 */
export type Interceptor<Context = unknown, State = unknown> = (
	// eslint-disable-next-line no-use-before-define
	next: InterceptorNext<Context, State>,
	interceptorBag?: InterceptorBag<Context, State>
) => any;

/**
 * Interceptor next function
 *
 * @typeParam Context - The type of the context that will be injected
 * @typeParam State - The type of the optional state that can be used to propagate state between interceptors
 */
export type InterceptorNext<Context = unknown, State = unknown> = () => ReturnType<Interceptor<Context, State>>;
