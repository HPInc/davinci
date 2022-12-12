/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassReflection, MethodReflection, TypeValue } from '@davinci/reflector';
import { Interceptor, InterceptorBagDetails, JSONSchema } from '@davinci/core';
import { Level } from 'pino';
import { ControllerDecoratorMetadata, MethodDecoratorMetadata, ParameterDecoratorOptions, Verb } from './decorators';

export type RequestHandler<TRequest = any, TResponse = any> = (req: TRequest, res: TResponse, next?: Function) => any;
export type ErrorRequestHandler<TRequest = any, TResponse = any> = (
	error: Error,
	req: TRequest,
	res: TResponse,
	next?: Function
) => any;

export type ParameterSource = 'path' | 'query' | 'body' | 'header' | 'request' | 'response';

export type ParameterConfiguration<Request> =
	| {
			name: string;
			source: ParameterDecoratorOptions['in'];
			request?: Request;
			value?: unknown;
			type?: TypeValue;
			options?: ParameterDecoratorOptions;
	  }
	| {
			source: 'context';
			reflection: { controllerReflection: ClassReflection; methodReflection: MethodReflection };
			request?: Request;
			value?: unknown;
			options?: ParameterDecoratorOptions;
	  }
	| {
			source: 'request';
			value?: unknown;
	  }
	| {
			source: 'response';
			value?: unknown;
	  };

export interface Route<Request> {
	path: string;
	verb: Verb;
	parametersConfig: ParameterConfiguration<Request>[];
	methodDecoratorMetadata?: MethodDecoratorMetadata;
	methodReflection: MethodReflection;
	controllerDecoratorMetadata?: ControllerDecoratorMetadata;
	controllerReflection: ClassReflection;
	responseStatusCodes?: Array<number>;
}

export interface ContextFactoryArguments<Request> {
	request: Request;
	reflection: { controllerReflection: ClassReflection; methodReflection: MethodReflection };
}

export type ContextFactory<Context, Request = any> = (args: ContextFactoryArguments<Request>) => Context;

export type ValidationFunction = (data: unknown) => typeof data;

export type ValidationFactory = (route: Route<any>) => ValidationFunction | Promise<ValidationFunction>;

export type HttpInterceptorBag = InterceptorBagDetails & {
	Request?: unknown;
	Response?: unknown;
};

export type HttpServerInterceptor<Bag extends HttpInterceptorBag = HttpInterceptorBag> = Interceptor<
	Bag,
	{ request?: Bag['Request']; response?: Bag['Response']; route?: Route<Bag['Request']> }
>;

export interface HttpServerModuleOptions {
	port?: number | string;
	contextFactory?: ContextFactory<unknown>;
	validationFactory?: ValidationFactory;
	errorsHandling?: {
		exposeStack?: boolean;
	};
	querystringJsonParsing?: boolean;
	globalInterceptors?: Array<HttpServerInterceptor>;
	logger?: {
		name?: string;
		level?: Level | 'silent';
	};
}

export type EndpointSchema = JSONSchema<any> & {
	properties: {
		body?: JSONSchema<any>;
		params?: JSONSchema<any>;
		querystring?: JSONSchema<any>;
		headers?: JSONSchema<any>;
	};
};

export interface StaticServeOptions {
	dotfiles?: 'allow' | 'deny' | 'ignore';
	etag?: boolean;
	immutable?: boolean;
	index?: string[] | string | false;
	lastModified?: boolean;
	maxAge?: number | string;
	redirect?: boolean;
}
