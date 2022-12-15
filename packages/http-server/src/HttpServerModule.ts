/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import {
	App,
	di,
	EntityRegistry,
	executeInterceptorsStack,
	getInterceptorsHandlers,
	Interceptor,
	InterceptorNext,
	mapParallel,
	mapSeries,
	Module
} from '@davinci/core';
import pathUtils from 'path';
import pino from 'pino';
import { ClassReflection, ClassType, DecoratorId, MethodReflection } from '@davinci/reflector';
import {
	ContextFactory,
	ContextFactoryArguments,
	HttpServerInterceptor,
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

interface HttpServerModuleGenerics<ModuleOptions> {
	Request?: unknown;
	Response?: unknown;
	Server?: unknown;
	ModuleOptions?: ModuleOptions;
}

export abstract class HttpServerModule<
	SMG extends HttpServerModuleGenerics<HttpServerModuleOptions> = HttpServerModuleGenerics<HttpServerModuleOptions>
> extends Module {
	app: App;
	validationFactory?: ValidationFactory;
	contextFactory?: ContextFactory<unknown>;
	globalInterceptors: Array<HttpServerInterceptor> = [];
	entityRegistry = di.container.resolve(EntityRegistry);
	routes: Route<SMG['Request']>[] = [];
	logger = pino({ name: 'http-server' });
	protected httpServer: SMG['Server'];

	constructor(protected moduleOptions?: SMG['ModuleOptions']) {
		super();
		this.contextFactory = moduleOptions?.contextFactory;
		this.validationFactory = moduleOptions?.validationFactory ?? createAjvValidator();
		this.globalInterceptors = moduleOptions?.globalInterceptors ?? [];
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

	public setHttpServer(httpServer: SMG['Server']) {
		this.httpServer = httpServer;
	}

	public setGlobalInterceptors(interceptors: Array<HttpServerInterceptor>) {
		this.globalInterceptors = interceptors;
	}

	public setContextFactory<Context>(contextFactory: ContextFactory<Context, SMG['Request']>): this {
		this.contextFactory = contextFactory;

		return this;
	}

	public async createRoutes(): Promise<Route<SMG['Request']>[]> {
		const controllersReflection = this.app
			.getControllersWithReflection()
			.filter(
				({ reflection }) =>
					reflection.decorators.some(d => d.module === 'http-server') ||
					reflection.methods.some(m => m.decorators.some(d => d.module === 'http-server'))
			);

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
						.reduce((acc, statusCodeString) => {
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
			...getInterceptorsHandlers(controllerReflection),
			...getInterceptorsHandlers(methodReflection)
		];

		const validatorFunction: ValidationFunction | null = await this.validationFactory?.(route);

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
						validationInterceptor,
						...interceptors,
						(_next, context) => controller[methodName](...context.handlerArgs)
					],
					interceptorsBag
				);

				const statusCode = httpServerModule.getResponseStatusCode(route);

				httpServerModule.status(response, statusCode);

				return httpServerModule.reply(response, result);
			} catch (err) {
				// default error handler, can be overridden by a dedicated interceptor
				return httpServerModule.reply(
					response,
					{ error: true, message: err.message, ...err?.toJSON?.(), stack: err.stack },
					err?.statusCode ?? 500
				);
			}
		};
	}

	getResponseStatusCode(route: Route<SMG['Request']>) {
		return route.responseStatusCodes?.find(s => s >= 100 && s <= 399) ?? 200;
	}

	// abstract get(handler: Function);
	abstract get(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>);

	// abstract post(handler: RequestHandler<SMG['Request]>, SMG['Response]);
	abstract post(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>);

	// abstract head(handler: RequestHandler<SMG['Request]>, SMG['Response]);
	abstract head(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>);

	// abstract delete(handler: RequestHandler<SMG['Request]>, SMG['Response]);
	abstract delete(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>);

	// abstract put(handler: RequestHandler<SMG['Request]>, SMG['Response]);
	abstract put(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>);

	// public createNotFoundHandler() {}

	// abstract patch(handler: RequestHandler<SMG['Request]>, SMG['Response]);
	abstract patch(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>);

	// abstract all(handler: RequestHandler<SMG['Request]>, SMG['Response]);
	abstract all(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>);

	// abstract options(handler: RequestHandler<SMG['Request]>, SMG['Response]);
	abstract options(path: unknown, handler: RequestHandler<SMG['Request'], SMG['Response']>);

	abstract static(path: string, options?: StaticServeOptions);

	abstract listen(): unknown | Promise<unknown>;

	abstract initHttpServer(): void;

	abstract setInstance(instance: unknown): void;

	abstract getInstance(): unknown;

	abstract reply(response, body: unknown, statusCode?: number);

	abstract close();

	abstract getRequestHostname(request: SMG['Request']);

	abstract getRequestMethod(request: SMG['Request']);

	abstract getRequestUrl(request: SMG['Request']);

	abstract getRequestParameter(args: {
		source: ParameterSource;
		name?: string;
		request: SMG['Request'];
		response: SMG['Response'];
	});

	abstract getRequestHeaders(request: SMG['Request']);

	abstract getRequestBody(request: SMG['Request']);

	abstract getRequestQuerystring(request: SMG['Request']);

	abstract status(response, statusCode: number);

	abstract redirect(response, statusCode: number, url: string);

	abstract setErrorHandler(handler: Function, prefix?: string);

	abstract setNotFoundHandler(handler: Function, prefix?: string);

	abstract setHeader(response, name: string, value: string);

	async createValidationInterceptor({
		validatorFunction,
		parametersConfig
	}: {
		validatorFunction;
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
