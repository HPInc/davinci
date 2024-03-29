/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import {
	HttpServerModule,
	HttpServerModuleOptions,
	ParameterSource,
	RequestHandler,
	StaticServeOptions
} from '@davinci/http-server';
import express, { Application, Express, Request, Response } from 'express';
import http, { Server as HttpServer } from 'http';
import https, { Server as HttpsServer, ServerOptions } from 'https';
import type { App } from '@davinci/core';
import type { OptionsJson, OptionsUrlencoded } from 'body-parser';
import { inject, InjectOptions } from 'light-my-request';
import cors, { CorsOptions } from 'cors';

type Server = HttpServer | HttpsServer;

export interface ExpressHttpServerModuleOptions extends HttpServerModuleOptions {
	instance?: Express | (() => Express);
	https?: ServerOptions;
	middlewares?: {
		json?: OptionsJson;
		urlencoded?: OptionsUrlencoded;
		cors?: CorsOptions;
	};
}

export class ExpressHttpServer extends HttpServerModule<{
	Request: Request;
	Response: Response;
	Server: Server;
	ModuleOptions: ExpressHttpServerModuleOptions;
}> {
	app?: App;
	instance?: Express;

	constructor(options?: ExpressHttpServerModuleOptions) {
		super(options ?? {});
		if (this.moduleOptions?.logger?.level) {
			this.logger.level = this.moduleOptions?.logger?.level;
		}
	}

	async onRegister(app: App) {
		this.app = app;
		const level = this.moduleOptions?.logger?.level ?? app.getOptions()?.logger?.level;
		if (level) {
			this.logger.level = level;
		}
		this.initHttpServer();
		this.registerMiddlewares();
		await super.createRoutes();
		// this.registerErrorHandlers();
	}

	async onInit() {
		return this.listen();
	}

	async onDestroy() {
		await this.close();
		this.logger.info('Server stopped');
	}

	registerMiddlewares() {
		if (!this.instance) throw new Error('instance not set, aborting');
		const { json, urlencoded, cors: corsOptions } = this.moduleOptions?.middlewares ?? {};

		this.instance.use(express.json({ ...json }));
		this.instance.use(express.urlencoded({ extended: true, ...urlencoded }));
		if (corsOptions) this.instance.use(cors(corsOptions));
	}

	initHttpServer() {
		const { instance } = this.moduleOptions ?? {};
		if (instance && typeof instance === 'function' && !(instance as Express).listen) {
			this.instance = (instance as Function)();
		} else {
			this.instance = (instance as Express) ?? express();
		}

		const server = super.moduleOptions?.https
			? https.createServer(super.moduleOptions?.https, this.getInstance())
			: http.createServer(this.getInstance());

		super.setHttpServer(server);
	}

	public reply(response: Response, body: unknown, statusCode?: number) {
		if (statusCode) {
			response.status(statusCode);
		}
		if (body === null || typeof body === 'undefined') {
			return response.send();
		}

		return typeof body === 'object' ? response.json(body) : response.send(String(body));
	}

	// @ts-ignore
	public use: Application['use'] = (...args) => {
		if (!this.instance) throw new Error('instance not set, aborting');

		return this.instance.use(...args);
	};

	public get(path: string, handler: RequestHandler<Request, Response>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		return this.instance.get(path, handler);
	}

	public post(path: string, handler: RequestHandler<Request, Response>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		return this.instance.post(path, handler);
	}

	public head(path: string, handler: RequestHandler<Request, Response>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		return this.instance.head(path, handler);
	}

	public delete(path: string, handler: RequestHandler<Request, Response>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		return this.instance.delete(path, handler);
	}

	public put(path: string, handler: RequestHandler<Request, Response>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		return this.instance.put(path, handler);
	}

	public patch(path: string, handler: RequestHandler<Request, Response>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		return this.instance.patch(path, handler);
	}

	public all(path: string, handler: RequestHandler<Request, Response>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		return this.instance.all(path, handler);
	}

	public options(path: string, handler: RequestHandler<Request, Response>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		return this.instance.options(path, handler);
	}

	public static(path: string, options?: StaticServeOptions) {
		if (!this.instance) throw new Error('instance not set, aborting');

		return this.instance.use(express.static(path, options));
	}

	listen() {
		if (!this.instance) throw new Error('instance not set, aborting');

		const port = this.moduleOptions?.port || 3000;
		this.setHttpServer(this.instance.listen(port));
		this.logger.info(`Server listening on port: ${port}`);
	}

	getInstance() {
		return this.instance;
	}

	setInstance(instance: Express) {
		this.instance = instance;
	}

	public status(response: Response, statusCode: number) {
		return response.status(statusCode);
	}

	public render(response: Response, view: string, options: any) {
		return response.render(view, options);
	}

	public redirect(response: Response, statusCode: number, url: string) {
		return response.redirect(statusCode, url);
	}

	public setErrorHandler(handler: RequestHandler<Request, Response>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		return this.instance.use(handler);
	}

	public setNotFoundHandler(handler: RequestHandler<Request, Response>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		return this.instance.use(handler);
	}

	public setHeader(response: Response, name: string, value: string) {
		return response.set(name, value);
	}

	public close() {
		return super.getHttpServer().close();
	}

	public getRequestHostname(request: Request): string {
		return request.hostname;
	}

	public getRequestMethod(request: Request): string {
		return request.method;
	}

	public getRequestUrl(request: Request): string {
		return request.originalUrl;
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
				return request.params[name as string];

			case 'header':
				return request.header(name as string);

			case 'query':
				return request.query[name as string];

			case 'body':
				return request.body;

			case 'request':
				return request;

			case 'response':
				return response;

			default:
				return undefined;
		}
	}

	performHttpInjection(injectOptions: InjectOptions): Promise<unknown> {
		return inject(this.instance as Express, injectOptions);
	}
}
