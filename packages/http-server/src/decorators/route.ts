/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
/* eslint-disable no-shadow */

import { decorateClass, decorateMethod, decorateParameter, DecoratorId } from '@davinci/reflector';
import {
	ControllerDecoratorOptions,
	MethodDecoratorOptions,
	ParameterDecoratorBaseOptions,
	ParameterDecoratorOptions,
	Verb
} from './types';

const createRouteMethodDecorator = (verb: Verb) => (options: MethodDecoratorOptions) => {
	return decorateMethod(
		{
			[DecoratorId]: 'http-server.method',
			module: 'http-server',
			type: 'route',
			verb,
			options
		},
		{ allowMultiple: true }
	);
};

export const get = createRouteMethodDecorator('get');
export const post = createRouteMethodDecorator('post');
export const put = createRouteMethodDecorator('put');
export const patch = createRouteMethodDecorator('patch');
export const del = createRouteMethodDecorator('delete');
export const head = createRouteMethodDecorator('head');
export const options = createRouteMethodDecorator('options');

export function param(options: ParameterDecoratorOptions) {
	return decorateParameter(
		{
			[DecoratorId]: 'http-server.parameter',
			module: 'http-server',
			type: 'parameter',
			options
		},
		{ allowMultiple: false, inherit: true }
	);
}

const createParameterDecorator = (inKey: 'path' | 'query' | 'body' | 'header') => {
	return (options?: ParameterDecoratorBaseOptions) => param({ in: inKey, ...options });
};

export const path = createParameterDecorator('path');
export const query = createParameterDecorator('query');
export const body = createParameterDecorator('body');
export const header = createParameterDecorator('header');

export function controller(options?: ControllerDecoratorOptions): ClassDecorator {
	return decorateClass(
		{
			[DecoratorId]: 'http-server.controller',
			module: 'http-server',
			type: 'controller',
			options
		},
		{ allowMultiple: false }
	);
}

export function request() {
	return decorateParameter(
		{
			[DecoratorId]: 'http-server.parameter.native',
			module: 'http-server',
			type: 'request'
		},
		{ allowMultiple: false, inherit: true }
	);
}

export function response() {
	return decorateParameter(
		{
			[DecoratorId]: 'http-server.parameter.native',
			module: 'http-server',
			type: 'response'
		},
		{ allowMultiple: false, inherit: true }
	);
}
