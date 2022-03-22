/*
 * © Copyright 2022 HP Development Compunknown, L.P.
 * SPDX-License-Identifier: MIT
 */
import { Module } from '@davinci/core';
import { RequestHandler, HttpModuleOptions /* CorsOptions */ } from './types';

export abstract class HttpModule<Request = unknown, Response = unknown, Server = unknown> implements Module {
	protected httpServer: Server;

	getModuleId() {
		return 'http';
	}

	constructor(protected moduleOptions?: HttpModuleOptions) {}

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

	public getHttpServer(): Server {
		return this.httpServer as Server;
	}

	public setHttpServer(httpServer: Server) {
		this.httpServer = httpServer;
	}

	abstract initHttpServer(): void;
	abstract setInstance(instance: unknown): void;
	abstract getInstance(): void;
	abstract reply(response, body: unknown, statusCode?: number);
	abstract close();
	abstract getRequestHostname(request);
	abstract getRequestMethod(request);
	abstract getRequestUrl(request);
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