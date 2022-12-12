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
import express, { Express, Request, Response } from 'express';
import http, { Server as HttpServer } from 'http';
import https, { Server as HttpsServer, ServerOptions } from 'https';
import type { App } from '@davinci/core';
import type { OptionsJson, OptionsUrlencoded } from 'body-parser';
import cors, { CorsOptions } from 'cors';

type Server = HttpServer | HttpsServer;

export interface ExpressHttpServerModuleOptions extends HttpServerModuleOptions {
	instance?: Express;
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
	instance: Express;
	app: App;

	constructor(options?: ExpressHttpServerModuleOptions) {
		const { instance, ...moduleOptions } = options ?? {};
		super(moduleOptions);
		this.instance = instance ?? express();
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
		this.registerMiddlewares();
		await super.createRoutes();
		// this.registerErrorHandlers();
		this.initHttpServer();
	}

	async onInit() {
		return this.listen();
	}

	async onDestroy() {
		await this.close();
		this.logger.info('Server stopped');
	}

	registerMiddlewares() {
		const { json, urlencoded, cors: corsOptions } = this.moduleOptions?.middlewares ?? {};

		this.instance.use(express.json({ ...json }));
		this.instance.use(express.urlencoded({ extended: true, ...urlencoded }));
		if (corsOptions) this.instance.use(cors(corsOptions));
	}

	initHttpServer() {
		const isHttpsEnabled = super.moduleOptions?.https;
		const server = isHttpsEnabled
			? https.createServer(super.moduleOptions.https, this.getInstance())
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

	public use: Express['use'] = (...args) => {
		return this.instance.use(...args);
	};

	public get(path: string, handler: RequestHandler<Request, Response>) {
		return this.instance.get(path, handler);
	}

	public post(path: string, handler: RequestHandler<Request, Response>) {
		return this.instance.post(path, handler);
	}

	public head(path: string, handler: RequestHandler<Request, Response>) {
		return this.instance.head(path, handler);
	}

	public delete(path: string, handler: RequestHandler<Request, Response>) {
		return this.instance.delete(path, handler);
	}

	public put(path: string, handler: RequestHandler<Request, Response>) {
		return this.instance.put(path, handler);
	}

	public patch(path: string, handler: RequestHandler<Request, Response>) {
		return this.instance.patch(path, handler);
	}

	public all(path: string, handler: RequestHandler<Request, Response>) {
		return this.instance.all(path, handler);
	}

	public options(path: string, handler: RequestHandler<Request, Response>) {
		return this.instance.options(path, handler);
	}

	public static(path: string, options?: StaticServeOptions) {
		return this.instance.use(express.static(path, options));
	}

	listen() {
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
		return this.instance.use(handler);
	}

	public setNotFoundHandler(handler: RequestHandler<Request, Response>) {
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
				return request.params[name];

			case 'header':
				return request.header(name);

			case 'query':
				return request.query[name];

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
}
