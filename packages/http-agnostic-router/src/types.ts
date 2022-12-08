/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

export interface RouteHandler<TRequest> {
	(request: TRequest, ...args: any): any;
}

export type RouteEntry<TRequest> = [string, RegExp, RouteHandler<TRequest>];

export type LowercaseMethod = 'get' | 'post' | 'patch' | 'put' | 'delete' | 'head' | 'options' | 'all';
export type UppercaseMethod = Uppercase<LowercaseMethod>;

export type Method = LowercaseMethod | UppercaseMethod;

export interface Request {
	method: Method;
	url: string;
	body?: unknown;
	params?: Record<string, any>;
	query?: Record<string, any> | string;
	headers?: Record<string, any>;
}

export type Response = {
	statusCode: number;
	headers: Record<string, string>;
	payload?: unknown;
};

export interface Cache<TRequest> {
	set: (key: string, value: RouteEntry<TRequest>) => void;
	get: (key: string) => RouteEntry<TRequest>;
}
