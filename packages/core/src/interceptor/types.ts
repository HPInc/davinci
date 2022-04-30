export type InterceptorBag<Context = unknown, State = unknown> = {
	module: string;
	handlerArgs: unknown[];
	context?: Context;
	state?: State;
};

export type Interceptor<Context, State> = (
	// eslint-disable-next-line no-use-before-define
	next: InterceptorNext<Context, State>,
	interceptorBag?: InterceptorBag<Context, State>
) => any;
export type InterceptorNext<Context, State> = () => ReturnType<Interceptor<Context, State>>;
