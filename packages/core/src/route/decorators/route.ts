/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import _ from 'lodash';
import { Reflector } from '@davinci/reflector';
import { IMethodParameter, IMethodParameterBase, IMethodDecoratorOptions, IMethodDecoratorMetadata } from '../types';

/**
 * Factory function that generates route method decorators
 * @param verb
 */
export const createRouteMethodDecorator = verb =>
	function({ path, summary, description, responses, validation, hidden }: IMethodDecoratorOptions): MethodDecorator {
		return function(prototype: object, methodName: string) {
			// get the existing metadata props
			const methods = Reflector.getMetadata('davinci:openapi:methods', prototype.constructor) || [];
			const meta: IMethodDecoratorMetadata = {
				path,
				verb,
				methodName,
				summary,
				description,
				responses,
				validation,
				hidden,
				handler: prototype[methodName]
			};
			let methodIndex = _.findIndex(methods, { methodName });
			methodIndex = methodIndex > -1 ? methodIndex : _.findIndex(methods, { path, verb });
			if (methodIndex && methodIndex > -1) {
				methods.splice(methodIndex, 1);
			}
			methods.unshift(meta);
			// define new metadata methods
			Reflector.defineMetadata('davinci:openapi:methods', methods, prototype.constructor);
		};
	};

export const get = createRouteMethodDecorator('get');
export const post = createRouteMethodDecorator('post');
export const put = createRouteMethodDecorator('put');
export const patch = createRouteMethodDecorator('patch');
export const del = createRouteMethodDecorator('delete');
export const head = createRouteMethodDecorator('head');

/**
 * Decorator that annotate a method parameter
 * @param options
 */
export function param(options: IMethodParameter): ParameterDecorator {
	return function(prototype: object, methodName: string, index) {
		// get the existing metadata props
		const methodParameters =
			Reflector.getMetadata('davinci:openapi:method-parameters', prototype.constructor) || [];

		const paramtypes = Reflector.getMetadata('design:paramtypes', prototype, methodName);
		const type = options.type ?? paramtypes?.[index];

		if (!options.name) {
			const methodParameterNames = Reflector.getParameterNames(prototype[methodName]);
			options.name = methodParameterNames[index];
		}
		const meta = {
			methodName,
			index,
			options,
			handler: prototype[methodName],
			type
		};

		const methodParameterIndex = _.findIndex(methodParameters, { methodName, index });
		if (methodParameterIndex > -1) {
			methodParameters[methodParameterIndex] = meta;
		} else {
			methodParameters.unshift(meta);
		}

		Reflector.defineMetadata('davinci:openapi:method-parameters', methodParameters, prototype.constructor);
	};
}

type ParameterName = string;
type CreateParamDecoratorFunctionArg = IMethodParameterBase | ParameterName;

// TODO: use openApi 3 requestBody for 'body'
export const createParamDecorator = (inKey: 'path' | 'query' | 'body') => (
	opts?: CreateParamDecoratorFunctionArg
): ParameterDecorator => {
	let options;
	if (typeof opts === 'string') {
		options = { name: opts, in: inKey };
	} else {
		options = { ...opts, in: inKey };
	}

	return param(options);
};

export const path = createParamDecorator('path');
export const query = createParamDecorator('query');
export const body = createParamDecorator('body');

export interface IControllerDecoratorArgs {
	basepath?: string;
	excludedMethods?: string[];
	resourceSchema?: Function;
	additionalSchemas?: Function[];
}

/**
 * Decorator that annotate a controller.
 * It allows setting the basepath, resourceSchema, etc
 * @param args
 */
export function controller(args?: IControllerDecoratorArgs): ClassDecorator {
	return function(target: Function) {
		// define new metadata props
		Reflector.defineMetadata('davinci:openapi:controller', args, target);
	};
}
