/*
 * © Copyright 2022 HP Development Compunknown, L.P.
 * SPDX-License-Identifier: MIT
 */
import { App, Module } from '@davinci/core';
import pathUtils from 'path';
import { ClassType, MethodReflection } from '@davinci/reflector';
import { HttpServerModuleOptions, ParameterSource, RequestHandler } from './types';
import { ControllerDecoratorMetadata, MethodDecoratorMetadata, ParameterDecoratorMetadata } from './decorators';

export abstract class HttpServerModule<Request = unknown, Response = unknown, Server = unknown> extends Module {
	protected httpServer: Server;
	app: App;

	getModuleId() {
		return 'http';
	}

	constructor(protected moduleOptions?: HttpServerModuleOptions) {
		super();
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

				return this[verb](fullPath, this.createRequestHandler(controller, methodName, methodReflection));
			});
		});
	}

	public createRequestHandler(
		controller: InstanceType<ClassType>,
		methodName: string,
		methodReflection: MethodReflection
	) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that = this;

		// using a named function here for better instrumentation and reporting
		return async function expressRequestHandler(req: Request, res: Response) {
			const parameters = methodReflection.parameters.map(parameterReflection => {
				const parameterDecoratorMetadata: ParameterDecoratorMetadata = parameterReflection.decorators.find(
					d => d.module === 'http-server' && d.type === 'parameter'
				);

				if (parameterDecoratorMetadata) {
					const { options } = parameterDecoratorMetadata;
					return that.getRequestParameter({
						source: options.in,
						name: options.name ?? parameterReflection.name,
						request: req
					});
				}

				return undefined;
			});

			try {
				const result = await controller[methodName](...parameters);

				return that.reply(res, result);
			} catch (err) {
				return that.reply(res, { error: true, message: err.message }, 500);
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

	abstract status(response, statusCode: number);

	abstract redirect(response, statusCode: number, url: string);

	abstract setErrorHandler(handler: Function, prefix?: string);

	abstract setNotFoundHandler(handler: Function, prefix?: string);

	abstract setHeader(response, name: string, value: string);

	/* abstract render(response, view: string, options: unknown);
	abstract useStaticAssets(...args: unknown[]);
	abstract setViewEngine(engine: string);

	abstract registerParserMiddleware(prefix?: string);
	abstract enableCors(options: CorsOptions, prefix?: string); */
}
