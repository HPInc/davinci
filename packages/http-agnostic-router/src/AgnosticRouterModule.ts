/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import {
	httpErrors,
	HttpServerModule,
	HttpServerModuleOptions,
	ParameterSource,
	RequestHandler
} from '@davinci/http-server';
import type { App } from '@davinci/core';
import { Router } from './Router';
import { Request, Response } from './types';

export interface AgnosticRouterModuleOptions<Req extends Request = Request> extends HttpServerModuleOptions {
	app?: Router<Req>;
	querystringParser?: (qs: string) => any;
}

export class AgnosticRouterModule<Req extends Request = Request> extends HttpServerModule<{
	Request: Request;
	Response: Response;
	ModuleOptions: AgnosticRouterModuleOptions<Req>;
}> {
	instance: Router<Req>;
	app: App;
	// TODO: find better solution
	close: undefined;
	getRequestHostname: undefined;
	listen: undefined;
	redirect: undefined;
	setErrorHandler: undefined;
	setInstance: undefined;
	setNotFoundHandler: undefined;
	static: undefined;
	initHttpServer: undefined;

	constructor(options?: AgnosticRouterModuleOptions<Req>) {
		const { app, ...moduleOptions } = options ?? {};
		super(moduleOptions);
		this.instance = app ?? new Router<Req>();
		if (this.moduleOptions.logger?.level) {
			this.logger.level = this.moduleOptions.logger?.level;
		}
	}

	async onRegister(app) {
		this.app = app;
		const level = this.moduleOptions.logger?.level ?? app.getOptions().logger?.level;
		if (level) {
			this.logger.level = level;
		}
		await super.createRoutes();

		this.app.eventBus.once('initialized', () => {
			this.instance.all('*', () => {
				throw new httpErrors.NotFound();
			});
		});

		Object.defineProperty(this.app, 'injectHttpRequest', {
			value: this.injectRequest.bind(this)
		});
	}

	async injectRequest(req: Req) {
		return this.instance.handle(
			{
				url: req.url,
				method: req.method,
				params: req.params,
				headers: req.headers ?? {}
			} as Req,
			{}
		);
	}

	public reply(response: Response, body: unknown, statusCode?: number) {
		response.statusCode = statusCode ?? 200;

		if (typeof body === 'object' && !response.headers?.['content-type']) {
			response.headers = response.headers ?? {};
			response.headers['content-type'] = 'application/json';
		}

		return { payload: body, ...response };
	}

	public get(path: string, handler: RequestHandler<Request, Response>) {
		this.instance.get(path, handler);
	}

	public post(path: string, handler: RequestHandler<Request, Response>) {
		this.instance.post(path, handler);
	}

	public head(path: string, handler: RequestHandler<Request, Response>) {
		this.instance.head(path, handler);
	}

	public delete(path: string, handler: RequestHandler<Request, Response>) {
		this.instance.delete(path, handler);
	}

	public put(path: string, handler: RequestHandler<Request, Response>) {
		this.instance.put(path, handler);
	}

	public patch(path: string, handler: RequestHandler<Request, Response>) {
		this.instance.patch(path, handler);
	}

	public all(path: string, handler: RequestHandler<Request, Response>) {
		this.instance.all(path, handler);
	}

	public options(path: string, handler: RequestHandler<Request, Response>) {
		this.instance.options(path, handler);
	}

	getInstance() {
		return this.instance;
	}

	public status(response: Response, statusCode: number) {
		response.statusCode = statusCode;
	}

	public setHeader(response: Response, name: string, value: string) {
		response.headers = response.headers ?? {};
		response.headers[name] = value;
	}

	public getRequestMethod(request: Request): string {
		return request.method;
	}

	public getRequestUrl(request: Request): string {
		return request.url;
	}

	public getRequestHeaders(request: Request) {
		return request.headers;
	}

	public getRequestBody(request: Request) {
		return request.body;
	}

	public getRequestQuerystring(request: Request) {
		return request.query;
	}

	getRequestParameter({
		source,
		name,
		request,
		response
	}: {
		source: ParameterSource;
		name?: string;
		request: Request;
		response: Response;
	}) {
		switch (source) {
			case 'path':
				return request.params?.[name];

			case 'header':
				return request.headers?.[name];

			case 'query':
				return request.query?.[name];

			case 'body':
				return request.body;

			case 'request':
				return request;

			case 'response':
				return response ?? {};

			default:
				return undefined;
		}
	}
}
