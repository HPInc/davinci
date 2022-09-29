/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassReflection, MethodReflection, TypeValue } from '@davinci/reflector';
import { JSONSchema } from '@davinci/core';
import { MethodDecoratorMetadata, ParameterDecoratorOptions, Verb } from './decorators';
import { AjvValidator, AjvValidatorOptions } from './AjvValidator';

export type ErrorHandler<TRequest = any, TResponse = any> = (
	error: any,
	req: TRequest,
	res: TResponse,
	next?: Function
) => any;

export type RequestHandler<TRequest = any, TResponse = any> = (req: TRequest, res: TResponse, next?: Function) => any;
export type ErrorRequestHandler<TRequest = any, TResponse = any> = (
	error: Error,
	req: TRequest,
	res: TResponse,
	next?: Function
) => any;

export interface HttpServerModuleOptions {
	port?: number | string;
	validator?: AjvValidator;
	validatorOptions?: AjvValidatorOptions;
}

export type ParameterSource = 'path' | 'query' | 'body' | 'header' | 'request' | 'response';

export interface ContextFactoryArguments<Request> {
	request: Request;
	reflection: { controllerReflection: ClassReflection; methodReflection: MethodReflection };
}

export type ContextFactory<Context, Request = any> = (args: ContextFactoryArguments<Request>) => Context;

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

export type EndpointSchema = JSONSchema<any> & {
	properties: {
		body?: JSONSchema<any>;
		params?: JSONSchema<any>;
		querystring?: JSONSchema<any>;
		headers?: JSONSchema<any>;
	};
};

export interface Route<Request> {
	path: string;
	verb: Verb;
	parametersConfig: ParameterConfiguration<Request>[];
	methodDecoratorMetadata: MethodDecoratorMetadata;
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
