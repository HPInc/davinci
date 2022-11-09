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

export abstract class HttpServerModule<
	Request = unknown,
	Response = unknown,
	Server = unknown,
	ModuleOptions extends HttpServerModuleOptions = HttpServerModuleOptions
> extends Module {
	app: App;
	validatorFactory?: ValidationFactory;
	contextFactory?: ContextFactory<unknown>;
	entityRegistry: EntityRegistry = new EntityRegistry();
	routes: Route<Request>[] = [];
	logger = pino({ name: 'http-server' });
	protected httpServer: Server;

	constructor(protected moduleOptions?: ModuleOptions) {
		super();
		this.contextFactory = moduleOptions?.contextFactory;
		this.validatorFactory = moduleOptions?.validatorFactory ?? createAjvValidator();
	}

	getModuleId() {
		return 'http';
	}

	public getModuleOptions() {
		return this.moduleOptions;
	}

	public getHttpServer(): Server {
		return this.httpServer as Server;
	}

	public setHttpServer(httpServer: Server) {
		this.httpServer = httpServer;
	}

	public setContextFactory<Context>(contextFactory: ContextFactory<Context, Request>): this {
		this.contextFactory = contextFactory;

		return this;
	}

	public async createRoutes() {
		const controllersReflection = this.app
			.getControllersWithReflection()
			.filter(
				({ reflection }) =>
					reflection.decorators.some(d => d.module === 'http-server') ||
					reflection.methods.some(m => m.decorators.some(d => d.module === 'http-server'))
			);

		return mapSeries(controllersReflection, ({ Controller, reflection: controllerReflection }) => {
			const controllerDecoratorMetadata: ControllerDecoratorMetadata = controllerReflection.decorators.find(
				d => d.module === 'http-server' && d.type === 'controller'
			);
			const basePath =
				controllerDecoratorMetadata?.options?.basePath ?? controllerDecoratorMetadata?.options?.basepath ?? '/';

			let ctrlInstance: typeof Controller;
			const getControllerInstance = () => {
				if (ctrlInstance) return ctrlInstance;

				ctrlInstance = di.container.resolve(Controller);

				return ctrlInstance;
			};

			return mapSeries(controllerReflection.methods, async methodReflection => {
				const methodDecoratorMetadata: MethodDecoratorMetadata = methodReflection.decorators.find(
					d => d[DecoratorId] === 'http-server.method'
				);
				const methodName = methodReflection.name;

				if (!methodDecoratorMetadata) return null;

				const {
					verb,
					options: { path }
				} = methodDecoratorMetadata;

				const controller = getControllerInstance();
				let fullPath = pathUtils.join(basePath, path);
				if (fullPath.length > 1 && fullPath[fullPath.length - 1] === '/') {
					fullPath = fullPath.slice(0, -1);
				}

				const parametersConfig = await this.createParametersConfigurations({
					controllerReflection,
					methodReflection
				});

				const route: Route<Request> = {
					path: fullPath,
					verb,
					parametersConfig,
					methodDecoratorMetadata,
					methodReflection,
					controllerDecoratorMetadata,
					controllerReflection
				};

				this.routes.push(route);

				return this[verb](fullPath, await this.createRequestHandler(controller, methodName, route));
			});
		});
	}

	public async createRequestHandler(controller: InstanceType<ClassType>, methodName: string, route: Route<Request>) {
		const { methodReflection, controllerReflection, parametersConfig } = route;
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const httpServerModule = this;
		const interceptors = [
			...getInterceptorsHandlers(controllerReflection),
			...getInterceptorsHandlers(methodReflection)
		];

		const validatorFunction: ValidationFunction | null = await this.validatorFactory?.(route);

		// using a named function here for better instrumentation and reporting
		return async function davinciHttpRequestHandler(request: Request, response: Response) {
			try {
				// enrich the parameter configurations with the values
				const parametersConfigWithValues: ParameterConfiguration<Request>[] = await mapParallel(
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

						const value = await httpServerModule.getRequestParameter({
							source: parameterConfig.source,
							name: parameterConfig.name,
							request,
							response
						});

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

	// abstract get(handler: Function);
	abstract get(path: unknown, handler: RequestHandler<Request, Response>);

	// abstract post(handler: RequestHandler<Request, Response>);
	abstract post(path: unknown, handler: RequestHandler<Request, Response>);

	// abstract head(handler: RequestHandler<Request, Response>);
	abstract head(path: unknown, handler: RequestHandler<Request, Response>);

	// abstract delete(handler: RequestHandler<Request, Response>);
	abstract delete(path: unknown, handler: RequestHandler<Request, Response>);

	// public createNotFoundHandler() {}

	// abstract put(handler: RequestHandler<Request, Response>);
	abstract put(path: unknown, handler: RequestHandler<Request, Response>);

	// abstract patch(handler: RequestHandler<Request, Response>);
	abstract patch(path: unknown, handler: RequestHandler<Request, Response>);

	// abstract all(handler: RequestHandler<Request, Response>);
	abstract all(path: unknown, handler: RequestHandler<Request, Response>);

	// abstract options(handler: RequestHandler<Request, Response>);
	abstract options(path: unknown, handler: RequestHandler<Request, Response>);

	abstract static(path: string, options?: StaticServeOptions);

	abstract listen(): unknown | Promise<unknown>;

	abstract initHttpServer(): void;

	abstract setInstance(instance: unknown): void;

	abstract getInstance(): void;

	abstract reply(response, body: unknown, statusCode?: number);

	abstract close();

	abstract getRequestHostname(request: Request);

	abstract getRequestMethod(request: Request);

	abstract getRequestUrl(request: Request);

	abstract getRequestParameter(args: {
		source: ParameterSource;
		name?: string;
		request: Request;
		response: Response;
	});

	abstract getRequestHeaders(request: Request);

	abstract getRequestBody(request: Request);

	abstract getRequestQuerystring(request: Request);

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
		parametersConfig: ParameterConfiguration<Request>[];
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
		return methodReflection.parameters.reduce<ParameterConfiguration<Request>[]>((acc, parameterReflection) => {
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
		}, []);
	}

	getEntityRegistry() {
		return this.entityRegistry;
	}

	getRoutes() {
		return this.routes;
	}

	private prepareInterceptorBag({
		request,
		parameters,
		context
	}: {
		request: Request;
		parameters: any[];
		context: any;
	}) {
		return {
			module: 'http-server',
			handlerArgs: parameters,
			context,
			state: {},
			request
		};
	}

	private async createContext({
		request,
		reflection: { controllerReflection, methodReflection }
	}: ContextFactoryArguments<Request>) {
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
