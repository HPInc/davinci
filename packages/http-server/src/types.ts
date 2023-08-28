/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassReflection, MethodReflection, TypeValue } from '@davinci/reflector';
import { Interceptor, InterceptorBagGenerics, InterceptorDecoratorMeta, JSONSchema } from '@davinci/core';
import { Level } from 'pino';
import type { Response as LightMyRequestResponse } from 'light-my-request';
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

export type ContextFactory<Context, Request = any> = (
	args: ContextFactoryArguments<Request>
) => Promise<Context> | Context;

export type HttpServerInterceptorStage = 'preValidation' | 'postValidation';

export interface HttpServerInterceptorMeta {
	stage?: HttpServerInterceptorStage;
}

export type HttpInterceptorBag = InterceptorBagGenerics & {
	Request?: unknown;
	Response?: unknown;
	Meta?: HttpServerInterceptorMeta;
};

export type HttpServerInterceptor<Bag extends HttpInterceptorBag = HttpInterceptorBag> = Interceptor<{
	Context: Bag['Context'];
	State: Bag['State'];
	Meta: HttpServerInterceptorMeta;
	Additional: {
		request?: Bag['Request'];
		response?: Bag['Response'];
		route?: Route<Bag['Request']>;
	};
}>;

export type EndpointSchema = JSONSchema<any> & {
	properties: {
		body?: JSONSchema<any>;
		params?: JSONSchema<any>;
		querystring?: JSONSchema<any>;
		headers?: JSONSchema<any>;
	};
};

export type ValidationFunction = (data: Record<keyof EndpointSchema['properties'], unknown>) => unknown;

export type ValidationFactory = (route: Route<any>) => ValidationFunction | Promise<ValidationFunction>;

export interface HttpServerModuleOptions {
	port?: number | string;
	contextFactory?: ContextFactory<unknown>;
	validationFactory?: ValidationFactory;
	errorHandling?: {
		/**
		 * enabled by default. False if process.env.NODE_ENV === 'production'
		 */
		exposeStack?: boolean;
	};
	querystringJsonParsing?: boolean;
	globalInterceptors?: Array<
		HttpServerInterceptor | { handler: InterceptorDecoratorMeta['handler']; stage: HttpServerInterceptorStage }
	>;
	logger?: {
		name?: string;
		level?: Level | 'silent';
	};
}

export interface StaticServeOptions {
	dotfiles?: 'allow' | 'deny' | 'ignore';
	etag?: boolean;
	immutable?: boolean;
	index?: string[] | string | false;
	lastModified?: boolean;
	maxAge?: number | string;
	redirect?: boolean;
}

export type InjectHttpResponse = Omit<LightMyRequestResponse, 'raw'>;
