/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import {
	HttpServerModule,
	HttpServerModuleOptions,
	InjectHttpResponse,
	ParameterSource,
	RequestHandler
} from '@davinci/http-server';
import type { App } from '@davinci/core';
import { Context as HonoContext, ErrorHandler, Hono } from 'hono';
// eslint-disable-next-line import/no-unresolved
import type { cors } from 'hono/cors';
import { InjectOptions } from 'light-my-request';
import qs from 'qs';

export type HonoCORSOptions = Parameters<typeof cors>[0];

export interface HonoHttpServerModuleOptions extends HttpServerModuleOptions {
	instance?: Hono | (() => Hono);
	waitForAppInitOnRequest?: boolean;
	cors?: boolean | HonoCORSOptions;
	/* cors?: HonoCorsOptions;
	plugins?: [HonoPluginCallback, HonoPluginOptions?][]; */
}

export class HonoHttpServer extends HttpServerModule<{
	Request: HonoContext;
	Response: HonoContext;
	Instance: Hono;
	RequestHandler: (context: HonoContext) => Response;
	ErrorRequestHandler: ErrorHandler;
	ModuleOptions: HonoHttpServerModuleOptions;
}> {
	app?: App;
	instance?: Hono;

	constructor(options?: HonoHttpServerModuleOptions) {
		super({ waitForAppInitOnRequest: true, ...options });
		if (this.moduleOptions?.logger?.level) {
			this.logger.level = this.moduleOptions?.logger?.level;
		}
	}

	onRegister(app: App) {
		this.app = app;
		const level = this.moduleOptions?.logger?.level ?? app.getOptions()?.logger?.level;
		if (level) {
			this.logger.level = level;
		}
		this.initHttpServer();
		this.registerMiddlewares();

		if (this.moduleOptions?.waitForAppInitOnRequest && this.instance) {
			this.instance.use(async (_ctx, next) => {
				await app.waitForStatus('initialized');
				return next();
			});
		}
		return super.createRoutes();
	}

	async onInit() {
		return this.listen();
	}

	async onDestroy() {
		await this.close();
		delete this.instance;
		this.setHttpServer(null);
		this.logger.info('Server destroyed');
	}

	registerMiddlewares() {
		if (!this.instance) throw new Error('instance not set, aborting');

		if (this.moduleOptions?.cors) {
			// eslint-disable-next-line @typescript-eslint/no-var-requires,global-require,import/no-unresolved
			const corsMiddleware = require('hono/cors');
			this.instance.use(corsMiddleware.cors(this.moduleOptions.cors));
		}
	}

	initHttpServer() {
		const { instance } = this.moduleOptions ?? {};
		if (instance instanceof Hono) {
			this.instance = instance;
		} else if (instance && typeof instance === 'function') {
			this.instance = instance();
		} else {
			this.instance = new Hono();
		}
	}

	public reply(honoCtx: HonoContext, body: unknown, statusCode = 200) {
		if (typeof body === 'object') {
			return honoCtx.json(body, statusCode);
		}

		if (typeof body === 'string') {
			return honoCtx.body(body, statusCode);
		}

		return honoCtx.newResponse(body as string | ArrayBuffer | ReadableStream, statusCode);
	}

	public get(path: string, handler: RequestHandler<HonoContext, HonoContext>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		this.instance.get(path, honoCtx => handler(honoCtx, honoCtx));

		return this.instance;
	}

	public post(path: string, handler: RequestHandler<HonoContext, HonoContext>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		this.instance.post(path, honoCtx => handler(honoCtx, honoCtx));

		return this.instance;
	}

	public head() {
		if (!this.instance) throw new Error('instance not set, aborting');

		this.instance.head();

		return this.instance;
	}

	public delete(path: string, handler: RequestHandler<HonoContext, HonoContext>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		this.instance.delete(path, honoCtx => handler(honoCtx, honoCtx));

		return this.instance;
	}

	public put(path: string, handler: RequestHandler<HonoContext, HonoContext>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		this.instance.put(path, honoCtx => handler(honoCtx, honoCtx));

		return this.instance;
	}

	public patch(path: string, handler: RequestHandler<HonoContext, HonoContext>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		this.instance.patch(path, honoCtx => handler(honoCtx, honoCtx));

		return this.instance;
	}

	public all(path: string, handler: RequestHandler<HonoContext, HonoContext>) {
		if (!this.instance) throw new Error('instance not set, aborting');

		this.instance.all(path, honoCtx => handler(honoCtx, honoCtx));

		return this.instance;
	}

	public options(path: string, handler: RequestHandler<HonoContext, HonoContext>) {
		if (!this.instance) throw new Error('Instance not set, aborting');

		this.instance.options(path, honoCtx => handler(honoCtx, honoCtx));

		return this.instance;
	}

	static() {
		return this.instance as Hono;
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	listen() {}

	getInstance(): Hono {
		if (!this.instance) {
			throw new Error('Instance not set, aborting');
		}

		return this.instance;
	}

	setInstance(instance: Hono) {
		this.instance = instance;
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public status(response: HonoContext, statusCode: number) {
		response.status(statusCode);
	}

	public redirect(response: HonoContext, statusCode: number, url: string) {
		return response.redirect(url, statusCode);
	}

	public setErrorHandler(handler: ErrorHandler) {
		if (!this.instance) throw new Error('instance not set, aborting');

		this.instance.onError(handler);
	}

	public setNotFoundHandler(handler: (context: HonoContext) => Response) {
		if (!this.instance) throw new Error('instance not set, aborting');

		this.instance.notFound(handler);
	}

	public setHeader(response: HonoContext, name: string, value: string) {
		// hono is sensitive with the casing of the headers, let's format it propertly
		const headerName = name
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join('-');
		return response.header(headerName, value);
	}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public close() {}

	// @ts-expect-error
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public getRequestHostname() {}

	public getRequestMethod(honoCtx: HonoContext) {
		return honoCtx.req.method;
	}

	public getRequestUrl(honoCtx: HonoContext) {
		return honoCtx.req.url;
	}

	public getRequestHeaders(honoCtx: HonoContext) {
		return honoCtx.req.headers;
	}

	public getRequestBody(honoCtx: HonoContext) {
		return honoCtx.req.body;
	}

	public getRequestQuerystring(honoCtx: HonoContext) {
		return honoCtx.req.query();
	}

	getRequestParameter({
		source,
		name,
		request,
		response
	}: {
		source: ParameterSource;
		name?: string;
		request: HonoContext;
		response: HonoContext;
	}) {
		switch (source) {
			case 'path':
				return request.req.param(name as string);

			case 'header':
				return request.req.header(name as string);

			case 'query':
				// The Hono query parsing is very limited and it doesn't allow to plug any additional parsing logic.
				// For this reason, we need to manually parse the querystring using qs and cache the result on the
				// context. In the future the querystring logic could be more flexible, allowing to be controlled
				// via module options.
				// eslint-disable-next-line no-case-declarations
				let parsedQuery: Record<string, unknown> = request.get('_parsedQuery');
				if (!parsedQuery) {
					const querystring = request.req.url.split('?')[1] ?? '';
					parsedQuery = qs.parse(querystring, { parseArrays: true });
					request.set('_parsedQuery', parsedQuery);
				}

				return parsedQuery[name as string];

			case 'body':
				return request.req.json();

			case 'request':
				return request;

			case 'response':
				return response;

			default:
				return undefined;
		}
	}

	async performHttpInjection(injectOptions: InjectOptions): Promise<InjectHttpResponse> {
		if (!this.instance) {
			throw new Error('Instance not set');
		}

		const path = typeof injectOptions.path === 'string' && injectOptions.path;
		if (!path) {
			throw new Error('Path is not a string');
		}

		const querystring = qs.stringify(injectOptions.query ?? {});
		const pathWithQuerystring = `${path}${querystring ? `?${querystring}` : ''}`;

		const options: RequestInit = {
			...(injectOptions.method && { method: injectOptions.method.toUpperCase() }),
			...(injectOptions.headers && { headers: new Headers(injectOptions.headers as Record<string, string>) }),
			...(injectOptions.payload && { body: JSON.stringify(injectOptions.payload) })
		};
		const response = await this.instance.request(pathWithQuerystring, options);

		const headers: Record<string, string> = {};
		response.headers.forEach((v, k) => {
			headers[k] = v;
		});

		const payload = await response.clone().text();

		return {
			headers,
			statusCode: response.status,
			json: <T>() => response.json() as T,
			rawPayload: Buffer.from(await response.clone().arrayBuffer()),
			statusMessage: String(response.status),
			payload,
			body: payload,
			cookies: [],
			trailers: {}
		};
	}
}
