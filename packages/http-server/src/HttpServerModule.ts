/*
 * © Copyright 2022 HP Development Compunknown, L.P.
 * SPDX-License-Identifier: MIT
 */
import { App, executeInterceptorsStack, getInterceptorsHandlers, mapParallel, Module } from '@davinci/core';
import pathUtils from 'path';
import pino from 'pino';
import { ClassReflection, ClassType, DecoratorId, MethodReflection } from '@davinci/reflector';
import {
	ContextFactory,
	ContextFactoryArguments,
	HttpServerModuleOptions,
	ParameterSource,
	RequestHandler
} from './types';
import { ControllerDecoratorMetadata, MethodDecoratorMetadata, ParameterDecoratorMetadata } from './decorators';

export abstract class HttpServerModule<Request = unknown, Response = unknown, Server = unknown> extends Module {
	app: App;
	contextFactory?: ContextFactory<unknown>;
	logger = pino({ name: 'http-server' });
	protected httpServer: Server;

	constructor(protected moduleOptions?: HttpServerModuleOptions) {
		super();
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

	public createRoutes() {
		const controllersReflection = this.app
			.getControllersWithReflection()
			.filter(
				({ reflection }) =>
					reflection.decorators.some(d => d.module === 'http-server') ||
					reflection.methods.some(m => m.decorators.some(d => d.module === 'http-server'))
			);

		return controllersReflection.map(({ Controller, reflection: controllerReflection }) => {
			const controllerDecoratorMetadata: ControllerDecoratorMetadata = controllerReflection.decorators.find(
				d => d.module === 'http-server' && d.type === 'controller'
			);
			const basePath =
				controllerDecoratorMetadata?.options?.basePath ?? controllerDecoratorMetadata?.options?.basepath ?? '/';

			let ctrlInstance: typeof Controller;
			const getControllerInstance = () => {
				if (ctrlInstance) return ctrlInstance;

				ctrlInstance = new Controller();

				return ctrlInstance;
			};

			return controllerReflection.methods.map(methodReflection => {
				const methodDecoratorMetadata: MethodDecoratorMetadata = methodReflection.decorators.find(
					d => d.module === 'http-server' && d.type === 'route'
				);
				const methodName = methodReflection.name;

				if (!methodDecoratorMetadata) return null;

				const {
					verb,
					options: { path }
				} = methodDecoratorMetadata;

				const controller = getControllerInstance();
				const fullPath = pathUtils.join(basePath, path);

				return this[verb](
					fullPath,
					this.createRequestHandler(controller, methodName, {
						methodReflection,
						controllerReflection
					})
				);
			});
		});
	}

	public createRequestHandler(
		controller: InstanceType<ClassType>,
		methodName: string,
		reflections: { methodReflection: MethodReflection; controllerReflection: ClassReflection }
	) {
		const { methodReflection, controllerReflection } = reflections;
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const httpServerModule = this;
		const interceptors = [
			...getInterceptorsHandlers(controllerReflection),
			...getInterceptorsHandlers(methodReflection)
		];

		// using a named function here for better instrumentation and reporting
		return async function davinciHttpRequestHandler(request: Request, response: Response) {
			try {
				const parameters = await mapParallel(methodReflection.parameters, parameterReflection => {
					const parameterDecoratorMetadata: ParameterDecoratorMetadata = parameterReflection.decorators.find(
						d => d[DecoratorId] === 'http-server.parameter' || d[DecoratorId] === 'core.parameter.context'
					);

					if (parameterDecoratorMetadata?.[DecoratorId] === 'http-server.parameter') {
						const { options } = parameterDecoratorMetadata;
						return httpServerModule.getRequestParameter({
							source: options.in,
							name: options.name ?? parameterReflection.name,
							request
						});
					}

					if (parameterDecoratorMetadata?.[DecoratorId] === 'core.parameter.context') {
						return httpServerModule.createContext({
							request,
							reflection: { controllerReflection, methodReflection }
						});
					}

					return undefined;
				});

				const interceptorsBag = httpServerModule.prepareInterceptorBag({
					request,
					parameters,
					context: await httpServerModule.createContext({
						request,
						reflection: { controllerReflection, methodReflection }
					})
				});

				const result = await executeInterceptorsStack(
					[...interceptors, (_next, context) => controller[methodName](...context.handlerArgs)],
					interceptorsBag
				);

				return httpServerModule.reply(response, result);
			} catch (err) {
				return httpServerModule.reply(response, { error: true, message: err.message }, 500);
			}
		};
	}

	// abstract get(handler: Function);
	abstract get(path: unknown, handler: RequestHandler<Request, Response>);

	// abstract post(handler: RequestHandler<Request, Response>);
	abstract post(path: unknown, handler: RequestHandler<Request, Response>);

	// public createNotFoundHandler() {}

	// abstract head(handler: RequestHandler<Request, Response>);
	abstract head(path: unknown, handler: RequestHandler<Request, Response>);

	// abstract delete(handler: RequestHandler<Request, Response>);
	abstract delete(path: unknown, handler: RequestHandler<Request, Response>);

	// abstract put(handler: RequestHandler<Request, Response>);
	abstract put(path: unknown, handler: RequestHandler<Request, Response>);

	// abstract patch(handler: RequestHandler<Request, Response>);
	abstract patch(path: unknown, handler: RequestHandler<Request, Response>);

	// abstract all(handler: RequestHandler<Request, Response>);
	abstract all(path: unknown, handler: RequestHandler<Request, Response>);

	// abstract options(handler: RequestHandler<Request, Response>);
	abstract options(path: unknown, handler: RequestHandler<Request, Response>);

	abstract listen(port: string | number, callback?: () => void);

	abstract listen(port: string | number, hostname: string, callback?: () => void);

	abstract initHttpServer(): void;

	abstract setInstance(instance: unknown): void;

	abstract getInstance(): void;

	abstract reply(response, body: unknown, statusCode?: number);

	abstract close();

	abstract getRequestHostname(request: Request);

	abstract getRequestMethod(request: Request);

	abstract getRequestUrl(request: Request);

	abstract getRequestParameter(args: { source: ParameterSource; name?: string; request: Request });

	abstract getRequestHeaders(request: Request);

	abstract getRequestBody(request: Request);

	abstract getRequestQuerystring(request: Request);

	abstract status(response, statusCode: number);

	abstract redirect(response, statusCode: number, url: string);

	abstract setErrorHandler(handler: Function, prefix?: string);

	abstract setNotFoundHandler(handler: Function, prefix?: string);

	abstract setHeader(response, name: string, value: string);

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
			request: {
				headers: this.getRequestHeaders(request),
				body: this.getRequestBody(request),
				query: this.getRequestQuerystring(request),
				url: this.getRequestUrl(request)
			}
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
