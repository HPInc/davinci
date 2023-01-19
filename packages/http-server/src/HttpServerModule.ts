/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import {
	App,
	di,
	EntityRegistry,
	executeInterceptorsStack,
	getInterceptorsDecorators,
	Interceptor,
	InterceptorNext,
	mapParallel,
	mapSeries,
	Module,
	omit
} from '@davinci/core';
import pathUtils from 'path';
import pino from 'pino';
import { ClassReflection, ClassType, DecoratorId, MethodReflection } from '@davinci/reflector';
import type { InjectOptions } from 'light-my-request';
import {
	ContextFactory,
	ContextFactoryArguments,
	HttpServerInterceptor,
	HttpServerInterceptorMeta,
	HttpServerModuleOptions,
	ParameterConfiguration,
	ParameterSource,
	RequestHandler,
	Route,
	StaticServeOptions,
	ValidationFactory,
	ValidationFunction
} from './types';
import { ControllerDecoratorMetadata, MethodDecoratorMetadata, ParameterDecoratorMetadata } from './decorators';
import { createAjvValidator } from './AjvValidator';
import { HttpError } from './httpErrors';

interface HttpServerModuleGenerics<ModuleOptions> {
	Request?: unknown;
	Response?: unknown;
	Server?: unknown;
	Instance?: unknown;
	ModuleOptions?: ModuleOptions;
}

export abstract class HttpServerModule<
	SMG extends HttpServerModuleGenerics<HttpServerModuleOptions> = HttpServerModuleGenerics<HttpServerModuleOptions>
> extends Module {
	app?: App;
	instance?: SMG['Instance'];
	validationFactory?: ValidationFactory;
	contextFactory?: ContextFactory<unknown>;
	globalInterceptors: Array<{ handler: HttpServerInterceptor; meta: HttpServerInterceptorMeta }> = [];
	entityRegistry = di.container.resolve(EntityRegistry);
	routes: Route<SMG['Request']>[] = [];
	exposeErrorStack: boolean;
	logger = pino({ name: 'http-server' });
	protected httpServer?: SMG['Server'];

	constructor(protected moduleOptions?: SMG['ModuleOptions']) {
		super();
		this.contextFactory = moduleOptions?.contextFactory;
		this.validationFactory = moduleOptions?.validationFactory ?? createAjvValidator();
		this.setGlobalInterceptors(moduleOptions?.globalInterceptors ?? []);
		this.exposeErrorStack = moduleOptions?.errorHandling?.exposeStack ?? process.env.NODE_ENV !== 'production';
	}

	getModuleId() {
		return 'http';
	}

	public getModuleOptions() {
		return this.moduleOptions;
	}

	public getHttpServer(): SMG['Server'] {
		return this.httpServer as SMG['Server'];
	}

	public setHttpServer(httpServer: SMG['Server'] | null) {
		this.httpServer = httpServer;
	}

	public setGlobalInterceptors(interceptors: HttpServerModuleOptions['globalInterceptors']) {
		this.globalInterceptors =
			interceptors?.map(i => {
				return typeof i === 'function'
					? { handler: i, meta: { stage: 'postValidation' } }
					: { handler: i.handler, meta: { stage: i.stage } };
			}) ?? [];
	}

	public setContextFactory<Context>(contextFactory: ContextFactory<Context, SMG['Request']>): this {
		this.contextFactory = contextFactory;

		return this;
	}

	public async createRoutes(): Promise<Route<SMG['Request']>[]> {
		this.addInjectFunction();

		const controllersReflection =
			this.app
				?.getControllersWithReflection()
				.filter(
					({ reflection }) =>
						reflection.decorators.some(d => d.module === 'http-server') ||
						reflection.methods.some(m => m.decorators.some(d => d.module === 'http-server'))
				) ?? [];

		await mapSeries(controllersReflection, ({ controllerInstance, reflection: controllerReflection }) => {
			const controllerDecoratorMetadata: ControllerDecoratorMetadata = controllerReflection.decorators.find(
				d => d.module === 'http-server' && d.type === 'controller'
			);
			const basePath =
				controllerDecoratorMetadata?.options?.basePath ?? controllerDecoratorMetadata?.options?.basepath ?? '/';

			return mapSeries(controllerReflection.methods, async methodReflection => {
				const methodDecoratorMetadatas: Array<MethodDecoratorMetadata> = methodReflection.decorators.filter(
					d => d[DecoratorId] === 'http-server.method'
				);
				const methodName = methodReflection.name;

				if (!methodDecoratorMetadatas.length) return null;

				return mapSeries(methodDecoratorMetadatas, async methodDecoratorMetadata => {
					const {
						verb,
						options: { path }
					} = methodDecoratorMetadata;

					let fullPath = pathUtils.join(basePath, path);
					if (fullPath.length > 1 && fullPath[fullPath.length - 1] === '/') {
						fullPath = fullPath.slice(0, -1);
					}

					const parametersConfig = await this.createParametersConfigurations({
						controllerReflection,
						methodReflection
					});

					const responseStatusCodes = Object.keys(methodDecoratorMetadata.options?.responses ?? {})
						.reduce<Array<number>>((acc, statusCodeString) => {
							const statusCode = Number(statusCodeString);
							if (!Number.isNaN(statusCode)) {
								acc.push(statusCode);
							}
							return acc;
						}, [])
						.sort();

					const route: Route<SMG['Request']> = {
						path: fullPath,
						verb,
						parametersConfig,
						methodDecoratorMetadata,
						methodReflection,
						controllerDecoratorMetadata,
						controllerReflection,
						responseStatusCodes
					};

					this.routes.push(route);

					return this[verb](fullPath, await this.createRequestHandler(controllerInstance, methodName, route));
				});
			});
		});

		return this.routes;
	}

	public async createRequestHandler(
		controller: InstanceType<ClassType>,
		methodName: string,
		route: Route<SMG['Request']>
	) {
		const { methodReflection, controllerReflection, parametersConfig } = route;
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const httpServerModule = this;

		const interceptors = [
			...this.globalInterceptors,
			...getInterceptorsDecorators<HttpServerInterceptor, HttpServerInterceptorMeta>(controllerReflection),
			...getInterceptorsDecorators<HttpServerInterceptor, HttpServerInterceptorMeta>(methodReflection)
		].reduce<{ preValidation: Array<HttpServerInterceptor>; postValidation: Array<HttpServerInterceptor> }>(
			(acc, interceptor) => {
				const stage = interceptor.meta?.stage ?? 'postValidation';
				acc[stage].push(interceptor.handler);

				return acc;
			},
			{ preValidation: [], postValidation: [] }
		);

		const validatorFunction: ValidationFunction | undefined = await this.validationFactory?.(route);

		// using a named function here for better instrumentation and reporting
		return async function davinciHttpRequestHandler(request: SMG['Request'], response: SMG['Response']) {
			try {
				// enrich the parameter configurations with the values
				const parametersConfigWithValues: ParameterConfiguration<SMG['Request']>[] = await mapParallel(
					parametersConfig,
					async parameterConfig => {
						if (parameterConfig.source === 'context') {
							const context = await httpServerModule.createContext({
								request,
								reflection: { controllerReflection, methodReflection }
							});

							return {
								value: context,
								source: 'context',
								reflection: { controllerReflection, methodReflection },
								request
							};
						}

						if (parameterConfig.source === 'request' || parameterConfig.source === 'response') {
							const value = await httpServerModule.getRequestParameter({
								source: parameterConfig.source,
								request,
								response
							});

							return {
								value,
								source: parameterConfig.source,
								request,
								response
							};
						}

						let value = await httpServerModule.getRequestParameter({
							source: parameterConfig.source,
							name: parameterConfig.name,
							request,
							response
						});

						if (
							parameterConfig.source === 'query' &&
							httpServerModule.moduleOptions?.querystringJsonParsing
						) {
							value = httpServerModule.maybeParseJsonifiedQuerystring(value);
						}

						return {
							value,
							source: parameterConfig.source,
							name: parameterConfig.name,
							request,
							response
						};
					}
				);

				// create the validation interceptor
				const validationInterceptor = await httpServerModule.createValidationInterceptor({
					parametersConfig: parametersConfigWithValues,
					validatorFunction
				});

				// create context for interceptors and parameters
				const contextParameterConfig = parametersConfigWithValues.find(p => p.source === 'context');
				const contextValue = contextParameterConfig
					? contextParameterConfig.value
					: await httpServerModule.createContext({
							request,
							reflection: { controllerReflection, methodReflection }
					  });

				const interceptorsBag = httpServerModule.prepareInterceptorBag({
					request,
					response,
					route,
					parameters: parametersConfigWithValues.map(p => p.value),
					context: contextValue
				});

				const result = await executeInterceptorsStack(
					[
						...interceptors.preValidation,
						validationInterceptor,
						...interceptors.postValidation,
						(_next, context) => controller[methodName](...(context?.handlerArgs ?? []))
					],
					interceptorsBag
				);

				const statusCode = httpServerModule.getResponseStatusCode(route);

				httpServerModule.status(response, statusCode);

				return httpServerModule.reply(response, result);
			} catch (err) {
				// default error handler, can be overridden by a dedicated interceptor

				const error = err as Error;
				let errorJson: Partial<ReturnType<typeof HttpError.prototype.toJSON>> = {
					stack: error.stack
				};
				let statusCode = 500;

				if (error instanceof HttpError) {
					errorJson = error?.toJSON?.();
					statusCode = errorJson.statusCode ?? statusCode;
				}

				errorJson = omit(errorJson, httpServerModule.exposeErrorStack ? [] : ['stack']);

				return httpServerModule.reply(
					response,
					{
						error: true,
						message: error.message,
						...errorJson
					},
					statusCode
				);
			}
		};
	}

	getResponseStatusCode(route: Route<SMG['Request']>) {
		return route.responseStatusCodes?.find(s => s >= 100 && s <= 399) ?? 200;
	}

	// abstract get(handler: Function);
	abstract get(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>): SMG['Instance'];

	// abstract post(handler: RequestHandler<SMG['Request]>, SMG['Response]);
	abstract post(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>): SMG['Instance'];

	// abstract head(handler: RequestHandler<SMG['Request]>, SMG['Response]);
	abstract head(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>): SMG['Instance'];

	// abstract delete(handler: RequestHandler<SMG['Request]>, SMG['Response]);
	abstract delete(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>): SMG['Instance'];

	// public createNotFoundHandler() {}

	// abstract put(handler: RequestHandler<SMG['Request]>, SMG['Response]);
	abstract put(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>): SMG['Instance'];

	// abstract patch(handler: RequestHandler<SMG['Request]>, SMG['Response]);
	abstract patch(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>): SMG['Instance'];

	// abstract all(handler: RequestHandler<SMG['Request]>, SMG['Response]);
	abstract all(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>): SMG['Instance'];

	// abstract options(handler: RequestHandler<SMG['Request]>, SMG['Response]);
	abstract options(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>): SMG['Instance'];

	abstract static(path: string, options?: StaticServeOptions): SMG['Instance'];

	abstract listen(): unknown | Promise<unknown>;

	abstract initHttpServer(): void;

	abstract setInstance(instance: unknown): void;

	abstract getInstance(): unknown;

	abstract reply(response: SMG['Response'], body: unknown, statusCode?: number): unknown;

	abstract close(): unknown | Promise<unknown>;

	abstract getRequestHostname(request: SMG['Request']): string;

	abstract getRequestMethod(request: SMG['Request']): string;

	abstract getRequestUrl(request: SMG['Request']): string;

	abstract getRequestParameter(args: {
		source: ParameterSource;
		name?: string;
		request: SMG['Request'];
		response: SMG['Response'];
	}): unknown;

	abstract getRequestHeaders(request: SMG['Request']): unknown;

	abstract getRequestBody(request: SMG['Request']): unknown;

	abstract getRequestQuerystring(request: SMG['Request']): unknown;

	abstract status(response: SMG['Response'], statusCode: number): unknown;

	abstract redirect(response: SMG['Response'], statusCode: number, url: string): unknown;

	abstract setErrorHandler(handler: Function, prefix?: string): unknown;

	abstract setNotFoundHandler(handler: Function, prefix?: string): unknown;

	abstract setHeader(response: SMG['Response'], name: string, value: string): unknown;

	async createValidationInterceptor({
		validatorFunction,
		parametersConfig
	}: {
		validatorFunction?: ValidationFunction;
		parametersConfig: ParameterConfiguration<SMG['Request']>[];
	}): Promise<Interceptor> {
		return async function validationInterceptor(next: InterceptorNext) {
			const data = parametersConfig.reduce((acc, parameterConfig) => {
				if (parameterConfig.source === 'path') {
					acc.params = acc.params ?? {};
					acc.params[parameterConfig.name] = parameterConfig.value;
				}

				if (parameterConfig.source === 'query') {
					acc.querystring = acc.querystring ?? {};
					acc.querystring[parameterConfig.name] = parameterConfig.value;
				}

				if (parameterConfig.source === 'body') {
					acc.body = parameterConfig.value;
				}

				if (parameterConfig.source === 'header') {
					acc.headers = acc.headers ?? {};
					acc.headers[parameterConfig.name] = parameterConfig.value;
				}

				return acc;
			}, {} as any);

			await validatorFunction?.(data);

			return next();
		};
	}

	createParametersConfigurations({
		controllerReflection,
		methodReflection
	}: {
		methodReflection: MethodReflection;
		controllerReflection: ClassReflection;
	}) {
		return methodReflection.parameters.reduce<ParameterConfiguration<SMG['Request']>[]>(
			(acc, parameterReflection) => {
				const parameterDecoratorMetadata: ParameterDecoratorMetadata = parameterReflection.decorators.find(
					d =>
						d[DecoratorId] === 'http-server.parameter' ||
						d[DecoratorId] === 'http-server.parameter.native' ||
						d[DecoratorId] === 'core.parameter.context'
				);

				if (parameterDecoratorMetadata?.[DecoratorId] === 'http-server.parameter') {
					const { options } = parameterDecoratorMetadata;
					const parameterType = parameterDecoratorMetadata.options?.type ?? parameterReflection.type;

					acc.push({
						source: options.in,
						name: options.name ?? parameterReflection.name,
						options,
						type: parameterType
					});
				}

				if (parameterDecoratorMetadata?.[DecoratorId] === 'core.parameter.context') {
					acc.push({
						source: 'context',
						options: parameterDecoratorMetadata.options,
						reflection: { controllerReflection, methodReflection }
					});
				}

				if (parameterDecoratorMetadata?.[DecoratorId] === 'http-server.parameter.native') {
					acc.push({
						source: parameterDecoratorMetadata.type as 'request' | 'response'
					});
				}

				return acc;
			},
			[]
		);
	}

	getEntityRegistry() {
		return this.entityRegistry;
	}

	getRoutes() {
		return this.routes;
	}

	public performHttpInjection?(injectOptions: InjectOptions): Promise<unknown>;

	protected addInjectFunction() {
		Object.defineProperty(this.app?.commands, 'injectHttpRequest', {
			configurable: true,
			value: async (req: InjectOptions, preferredHttpModule = 'http') => {
				if (!this.performHttpInjection) {
					throw new Error('injectHttpRequest is not supported by the underlying http server implementation');
				}

				const httpModule = await this.app?.getModuleById<HttpServerModule>(preferredHttpModule);
				if (!httpModule) {
					throw new Error(`Module ${preferredHttpModule} not found`);
				}

				return httpModule?.performHttpInjection?.(req);
			}
		});
	}

	private maybeParseJsonifiedQuerystring(str: unknown) {
		if (typeof str === 'string' && str.charAt(0) === '{' && str.charAt(str.length - 1) === '}') {
			// the string looks like a jsonified string, let's try to parse it
			try {
				return JSON.parse(str);
			} catch (err) {
				return str;
			}
		}

		return str;
	}

	private prepareInterceptorBag({
		request,
		response,
		route,
		parameters,
		context
	}: {
		request: SMG['Request'];
		response: SMG['Response'];
		route: Route<SMG['Request']>;
		parameters: any[];
		context: any;
	}) {
		return {
			module: 'http-server',
			handlerArgs: parameters,
			context,
			state: {},
			request,
			response,
			route
		};
	}

	private async createContext({
		request,
		reflection: { controllerReflection, methodReflection }
	}: ContextFactoryArguments<SMG['Request']>) {
		try {
			return await this.contextFactory?.({
				request,
				reflection: { controllerReflection, methodReflection }
			});
		} catch (err) {
			this.logger.error({ err }, 'An error happened during the creation of the context');
			throw err;
		}
	}

	/* abstract render(response, view: string, options: unknown);
	abstract useStaticAssets(...args: unknown[]);
	abstract setViewEngine(engine: string);

	abstract registerParserMiddleware(prefix?: string);
	abstract enableCors(options: CorsOptions, prefix?: string); */
}
