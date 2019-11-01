import _ from 'lodash';
import { Reflector } from '@davinci/reflector';
import { IMethodParameter, IMethodParameterBase } from '../types/openapi';

interface IMethodResponseOutput {
	description?: string;
	schema?: { $ref: string };
}

interface IMethodResponses {
	[key: number]: Function | IMethodResponseOutput | ((string) => IMethodResponseOutput);
}

interface IMethodDecoratorOptions {
	path: string;
	summary: string;
	description?: string;
	responses?: IMethodResponses;
}

/**
 * Factory function that generates route method decorators
 * @param verb
 */
export const createRouteMethodDecorator = verb =>
	function({ path, summary, description, responses }: IMethodDecoratorOptions): Function {
		return function(prototype: Record<string, any>, methodName: string | symbol) {
			// get the existing metadata props
			const methods = Reflector.getMetadata('davinci:openapi:methods', prototype.constructor) || [];
			const meta = { path, verb, methodName, summary, description, responses, handler: prototype[methodName] };
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
export function param(options: IMethodParameter): Function {
	return function(prototype: Record<string, any>, methodName: string, index) {
		// get the existing metadata props
		const methodParameters = Reflector.getMetadata('davinci:openapi:method-parameters', prototype.constructor) || [];
		const paramtypes = Reflector.getMetadata('design:paramtypes', prototype, methodName);
		if (!options.name) {
			const methodParameterNames = Reflector.getParameterNames(prototype[methodName]);
			options.name = methodParameterNames[index];
		}
		const meta = {
			methodName,
			index,
			options,
			handler: prototype[methodName],
			type: paramtypes && paramtypes[index]
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
): Function => {
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
export function controller(args?: IControllerDecoratorArgs): Function {
	return function(target: Function) {
		// define new metadata props
		Reflector.defineMetadata('davinci:openapi:controller', args, target);
	};
}
