/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import URL from 'url-parse';
import qs from 'qs';
import { Cache, Method, Request, RouteEntry, RouteHandler, UppercaseMethod } from './types';

export interface RouterOptions<Req> {
	querystringParser?: (qstring: string) => any;
	cache?: Cache<Req>;
}

const defaultOptions: Partial<RouterOptions<any>> = {
	querystringParser: qstring => qs.parse(qstring, { depth: 10, parseArrays: true })
};

export class Router<Req extends Request = Request> {
	routes: Array<RouteEntry<Req>> = [];
	routesDict: Record<Method | string, Array<RouteEntry<Req>>> = {};
	cache: Cache<Req>;
	private routerOptions: RouterOptions<Req>;

	constructor(options?: RouterOptions<Req>) {
		this.routerOptions = { ...defaultOptions, ...options };
		// eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
		this.cache = options?.cache ?? new (require('lru-cache'))({ max: 1000 });
	}

	addRoute(method: Method, path: string, handler: RouteHandler<Req>) {
		const uppercaseMethod = String(method).toUpperCase();
		const route: RouteEntry<Req> = [
			uppercaseMethod,
			RegExp(
				`^${
					path
						.replace(/(\/?)\*/g, '($1.*)?') // trailing wildcard
						.replace(/(\/$)|((?<=\/)\/)/, '') // remove trailing slash or double slash from joins
						.replace(/:(\w+)(\?)?(\.)?/g, '$2(?<$1>[^/]+)$2$3') // named params
						.replace(/\.(?=[\w(])/, '\\.') // dot in path
						// eslint-disable-next-line no-useless-escape
						.replace(/\)\.\?\(([^\[]+)\[\^/g, '?)\\.?($1(?<=\\.)[^\\.') // optional image format
				}/*$`
			),
			handler
		];

		this.routes.push(route);
		this.routesDict[uppercaseMethod] = this.routesDict[uppercaseMethod] ?? [];
		this.routesDict[uppercaseMethod].push(route);
	}

	get(path: string, handler: RouteHandler<Req>) {
		this.addRoute('GET', path, handler);
	}
	post(path: string, handler: RouteHandler<Req>) {
		this.addRoute('POST', path, handler);
	}
	put(path: string, handler: RouteHandler<Req>) {
		this.addRoute('PUT', path, handler);
	}
	patch(path: string, handler: RouteHandler<Req>) {
		this.addRoute('PATCH', path, handler);
	}
	delete(path: string, handler: RouteHandler<Req>) {
		this.addRoute('DELETE', path, handler);
	}
	head(path: string, handler: RouteHandler<Req>) {
		this.addRoute('HEAD', path, handler);
	}
	options(path: string, handler: RouteHandler<Req>) {
		this.addRoute('OPTIONS', path, handler);
	}
	all(path: string, handler: RouteHandler<Req>) {
		this.addRoute('ALL', path, handler);
	}

	async handle(request: Req, ...args: unknown[]) {
		const uppercaseMethod = request.method.toUpperCase() as UppercaseMethod;
		const url = new URL(request.url);
		if (url.query) {
			request.query = this.routerOptions.querystringParser(url.query.substring(1));
		}

		if (!this.routesDict[uppercaseMethod]) {
			return null;
		}

		const cacheKey = `${uppercaseMethod}:${url}`;
		const cachedRouteEntry = this.cache.get(cacheKey);
		if (cachedRouteEntry) {
			const [, , handler] = cachedRouteEntry;

			return handler(request, ...args);
		}

		const routeEntry = this.findRequestRoute(request, uppercaseMethod, url);

		if (routeEntry) {
			this.cache.set(cacheKey, routeEntry);
			return routeEntry[2](request, ...args);
		}

		return null;
	}

	findRequestRoute(request: Req, method: UppercaseMethod, url: URL<unknown>): RouteEntry<Req> | null {
		// eslint-disable-next-line no-restricted-syntax
		for (const routeEntry of this.routesDict[method]) {
			const [routeMethod, route] = routeEntry;
			const match = url.pathname.match(route);
			if ((routeMethod === method || routeMethod === 'ALL') && match) {
				if (match.groups) {
					request.params = match.groups;
				}
				return routeEntry;
			}
		}

		return null;
	}
}
