/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { HttpModule, HttpModuleOptions, RequestHandler } from '@davinci/http';
import express, { Express, Request, Response } from 'express';
import http, { Server as HttpServer } from 'http';
import https, { Server as HttpsServer } from 'https';

type Server = HttpServer | HttpsServer;

type ExpressHttpModuleOptions = { app?: Express } & HttpModuleOptions;

export class ExpressHttpModule extends HttpModule<Request, Response, Server> {
	instance: Express;

	constructor(options?: ExpressHttpModuleOptions) {
		const { app, ...moduleOptions } = options ?? {};
		super(moduleOptions);
		this.instance = app ?? express();
	}

	onInit() {
		this.initHttpServer();
		return super.getHttpServer().listen(super.moduleOptions?.port ?? 3000);
	}

	onDestroy() {
		return new Promise((resolve, reject) => {
			return super.getHttpServer()?.close(err => {
				if (err) return reject(err);

				return resolve(null);
			});
		});
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

	public use(...args: any[]) {
		return this.instance.use(...args);
	}

	public get(path: string, handler: RequestHandler<Request, Response>) {
		this.instance.get(path, handler);
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

	public listen(port: string | number, callback?: () => void);
	public listen(port: string | number, hostname: string, callback?: () => void);
	public listen(...args: unknown[]) {
		this.instance.listen(args[0] as number, args[1] as string, args[2] as () => void);
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
		if (!super.httpServer) {
			return undefined;
		}
		return new Promise(resolve => super.httpServer.close(resolve));
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
}