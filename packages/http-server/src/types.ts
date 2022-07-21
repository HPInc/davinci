/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ServerOptions } from 'https';
import { ClassReflection, MethodReflection } from '@davinci/reflector';
import { ParameterDecoratorOptions } from './decorators';

export type ErrorHandler<TRequest = any, TResponse = any> = (
	error: any,
	req: TRequest,
	res: TResponse,
	next?: Function
) => any;

export type RequestHandler<TRequest = any, TResponse = any> = (req: TRequest, res: TResponse, next?: Function) => any;

export interface HttpServerModuleOptions {
	port?: number | string;
	https?: ServerOptions;
}

export type ParameterSource = 'path' | 'query' | 'body' | 'header';

type OriginCallback = (err: Error | null, allow: boolean) => void;
export type OriginFunction = (origin: string, callback: OriginCallback) => void;
type OriginType = string | boolean | RegExp;
type ValueOrArray<T> = T | Array<T>;

export interface CorsOptions {
	/**
	 * Configures the Access-Control-Allow-Origin CORS header.
	 */
	origin?: ValueOrArray<OriginType> | OriginFunction;
	/**
	 * Configures the Access-Control-Allow-Credentials CORS header.
	 * Set to true to pass the header, otherwise it is omitted.
	 */
	credentials?: boolean;
	/**
	 * Configures the Access-Control-Expose-Headers CORS header.
	 * Expects a comma-delimited string (ex: 'Content-Range,X-Content-Range')
	 * or an array (ex: ['Content-Range', 'X-Content-Range']).
	 * If not specified, no custom headers are exposed.
	 */
	exposedHeaders?: string | string[];
	/**
	 * Configures the Access-Control-Allow-Headers CORS header.
	 * Expects a comma-delimited string (ex: 'Content-Type,Authorization')
	 * or an array (ex: ['Content-Type', 'Authorization']). If not
	 * specified, defaults to reflecting the headers specified in the
	 * request's Access-Control-Request-Headers header.
	 */
	allowedHeaders?: string | string[];
	/**
	 * Configures the Access-Control-Allow-Methods CORS header.
	 * Expects a comma-delimited string (ex: 'GET,PUT,POST') or an array (ex: ['GET', 'PUT', 'POST']).
	 */
	methods?: string | string[];
	/**
	 * Configures the Access-Control-Max-Age CORS header.
	 * Set to an integer to pass the header, otherwise it is omitted.
	 */
	maxAge?: number;
	/**
	 * Pass the CORS preflight response to the route handler (default: false).
	 */
	preflightContinue?: boolean;
	/**
	 * Provides a status code to use for successful OPTIONS requests,
	 * since some legacy browsers (IE11, various SmartTVs) choke on 204.
	 */
	optionsSuccessStatus?: number;
	/**
	 * Pass the CORS preflight response to the route handler (default: false).
	 */
	preflight?: boolean;
	/**
	 * Enforces strict requirement of the CORS preflight request headers (Access-Control-Request-Method and Origin).
	 * Preflight requests without the required headers will result in 400 errors when set to `true` (default: `true`).
	 */
	strictPreflight?: boolean;
	/**
	 * Hide options route from the documentation built using fastify-swagger (default: true).
	 */
	hideOptionsRoute?: boolean;
}

export interface ContextFactoryArguments<Request> {
	request: Request;
	reflection: { controllerReflection: ClassReflection; methodReflection: MethodReflection };
}

export type ContextFactory<Context, Request = any> = (args: ContextFactoryArguments<Request>) => Context;

export type ParameterConfiguration<Request> =
	| {
			source: ParameterDecoratorOptions['in'];
			name: string;
			request?: Request;
			value?: unknown;
	  }
	| {
			source: 'context';
			reflection: { controllerReflection: ClassReflection; methodReflection: MethodReflection };
			request?: Request;
			value?: unknown;
	  };
