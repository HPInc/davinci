/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import URL from 'url-parse';
import qs from 'qs';
import { Request, RouteEntry, RouteHandler } from './types';

export interface RouterOptions {
	querystringParser?: (qstring: string) => any;
}

const defaultOptions: Partial<RouterOptions> = {
	querystringParser: qstring => qs.parse(qstring, { depth: 10, parseArrays: true })
};

export class Router<Req extends Request = Request> {
	routes: Array<RouteEntry<Req>> = [];
	private routerOptions: RouterOptions;

	constructor(options?: RouterOptions) {
		this.routerOptions = { ...defaultOptions, ...options };
	}

	addRoute(method: string, path: string, handler: RouteHandler<Req>) {
		this.routes.push([
			String(method).toUpperCase(),
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
		]);
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
		const url = new URL(request.url);
		if (url.query) {
			request.query = this.routerOptions.querystringParser(url.query.substring(1));
		}
		// eslint-disable-next-line no-restricted-syntax
		for (const [method, route, handler] of this.routes) {
			const match = url.pathname.match(route);
			if ((method === request.method.toUpperCase() || method === 'ALL') && match) {
				if (match.groups) {
					request.params = match.groups;
				}
				return handler(request, ...args);
			}
		}

		return null;
	}
}
