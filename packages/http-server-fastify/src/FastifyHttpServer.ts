/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import {
	ErrorRequestHandler,
	HttpServerModule,
	HttpServerModuleOptions,
	ParameterSource,
	RequestHandler
} from '@davinci/http-server';
import {
	fastify,
	FastifyInstance,
	FastifyPluginCallback,
	FastifyPluginOptions,
	FastifyReply,
	FastifyRequest
} from 'fastify';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import type { App } from '@davinci/core';
import fastifyCors, { FastifyCorsOptions } from '@fastify/cors';
import fastifyStatic, { FastifyStaticOptions } from '@fastify/static';
import qs from 'qs';

type Server = HttpServer | HttpsServer;

export interface FastifyHttpServerModuleOptions extends HttpServerModuleOptions {
	instance?: FastifyInstance;
	middlewares?: {
		cors?: FastifyCorsOptions;
	};
	plugins?: [FastifyPluginCallback, FastifyPluginOptions?][];
}

export class FastifyHttpServer extends HttpServerModule<{
	Request: FastifyRequest;
	Response: FastifyReply;
	Server: Server;
	ModuleOptions: FastifyHttpServerModuleOptions;
}> {
	instance: FastifyInstance;
	app: App;

	constructor(options?: FastifyHttpServerModuleOptions) {
		const { instance, ...moduleOptions } = options ?? {};
		super(moduleOptions);
		this.instance = instance;
		if (this.moduleOptions.logger?.level) {
			this.logger.level = this.moduleOptions.logger?.level;
		}
	}

	async onRegister(app: App) {
		this.app = app;
		const level = this.moduleOptions.logger?.level ?? app.getOptions().logger?.level;
		if (level) {
			this.logger.level = level;
		}
		this.initHttpServer();
		await this.registerMiddlewares();
		await this.registerPlugins();

		await super.createRoutes();
	}

	async onInit() {
		return this.listen();
	}

	async onDestroy() {
		await this.close();
		this.logger.info('Server stopped');
	}

	async registerMiddlewares() {
		if (this.moduleOptions?.middlewares?.cors) {
			await this.instance.register(fastifyCors, this.moduleOptions?.middlewares?.cors);
		}
	}

	async registerPlugins() {
		const promises =
			this.moduleOptions?.plugins?.map(([plugin, options]) => this.instance.register(plugin, options)) ?? [];
		return Promise.all(promises);
	}

	initHttpServer() {
		this.instance =
			this.instance ??
			fastify({
				querystringParser: str => qs.parse(str, { parseArrays: true })
			});
		super.setHttpServer(this.instance.server);
	}

	public reply(response: FastifyReply, body: unknown, statusCode?: number) {
		if (statusCode) {
			response.status(statusCode);
		}

		return response.send(body);
	}

	public get(path: string, handler: RequestHandler<FastifyRequest, FastifyReply>) {
		return this.instance.get(path, handler);
	}

	public post(path: string, handler: RequestHandler<FastifyRequest, FastifyReply>) {
		return this.instance.post(path, handler);
	}

	public head(path: string, handler: RequestHandler<FastifyRequest, FastifyReply>) {
		return this.instance.head(path, handler);
	}

	public delete(path: string, handler: RequestHandler<FastifyRequest, FastifyReply>) {
		return this.instance.delete(path, handler);
	}

	public put(path: string, handler: RequestHandler<FastifyRequest, FastifyReply>) {
		return this.instance.put(path, handler);
	}

	public patch(path: string, handler: RequestHandler<FastifyRequest, FastifyReply>) {
		return this.instance.patch(path, handler);
	}

	public all(path: string, handler: RequestHandler<FastifyRequest, FastifyReply>) {
		return this.instance.all(path, handler);
	}

	public options(path: string, handler: RequestHandler<FastifyRequest, FastifyReply>) {
		return this.instance.options(path, handler);
	}

	public static(path: string, options?: Omit<FastifyStaticOptions, 'root'>) {
		return this.instance.register(fastifyStatic, { root: path, ...options });
	}

	async listen() {
		const port = Number(this.moduleOptions?.port) || 3000;
		await this.instance.listen({ port: Number(port), host: '0.0.0.0' });
		this.logger.info(`Server listening on port: ${port}`);
	}

	getInstance() {
		return this.instance;
	}

	setInstance(instance: FastifyInstance) {
		this.instance = instance;
	}

	public status(response: FastifyReply, statusCode: number) {
		return response.status(statusCode);
	}

	public redirect(response: FastifyReply, statusCode: number, url: string) {
		return response.redirect(statusCode, url);
	}

	public setErrorHandler(handler: ErrorRequestHandler<FastifyRequest, FastifyReply>) {
		return this.instance.setErrorHandler(handler);
	}

	public setNotFoundHandler(handler: RequestHandler<FastifyRequest, FastifyReply>) {
		return this.instance.setNotFoundHandler(handler);
	}

	public setHeader(response: FastifyReply, name: string, value: string) {
		return response.header(name, value);
	}

	public close() {
		return this.instance.close();
	}

	public getRequestHostname(request: FastifyRequest): string {
		return request.hostname;
	}

	public getRequestMethod(request: FastifyRequest): string {
		return request.method;
	}

	public getRequestUrl(request: FastifyRequest): string {
		return request.url;
	}

	public getRequestHeaders(request: FastifyRequest) {
		return request.headers;
	}

	public getRequestBody(request: FastifyRequest) {
		return request.body;
	}

	public getRequestQuerystring(request: FastifyRequest) {
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
		request: FastifyRequest;
		response: FastifyReply;
	}) {
		switch (source) {
			case 'path':
				return request.params[name];

			case 'header':
				return request.headers[name];

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
