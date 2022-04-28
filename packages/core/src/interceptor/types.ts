export type InterceptorBag<ModuleInterceptorBag> = {
	module: string;
	handlerArgs: unknown[];
	state?: any;
} & ModuleInterceptorBag;

export type Interceptor<ModuleInterceptorBag = Map<string, any>> = (
	// eslint-disable-next-line no-use-before-define
	next: InterceptorNext<ModuleInterceptorBag>,
	interceptorBag?: InterceptorBag<ModuleInterceptorBag>
) => any;
export type InterceptorNext<ModuleInterceptorBag> = () => ReturnType<Interceptor<ModuleInterceptorBag>>;
