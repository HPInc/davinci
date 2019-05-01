import _ from 'lodash';
import { IMethodParameter, IMethodParameterBase } from '../types';

interface IMethodResponseOutput {
	description?: string;
	schema?: { $ref: string };
}

interface IMethodResponses {
	[key: number]: IMethodResponseOutput | ((string) => IMethodResponseOutput);
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
		return function(target: Object, methodName: string | symbol) {
			// get the existing metadata props
			const methods = Reflect.getMetadata('tsswagger:methods', target) || [];
			methods.unshift({ path, verb, methodName, summary, description, responses, handler: target[methodName] });
			// define new metadata methods
			Reflect.defineMetadata('tsswagger:methods', methods, target);
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
	return function(target: Object, methodName: string, index) {
		// get the existing metadata props
		const methodParameters = Reflect.getMetadata('tsswagger:method-parameters', target) || [];
		const paramtypes = Reflect.getMetadata('design:paramtypes', target, methodName);
		const isAlreadySet = !!_.find(methodParameters, { methodName, index });
		if (isAlreadySet) return;

		methodParameters.unshift({
			target,
			methodName,
			index,
			options,
			handler: target[methodName],
			/*
				The method: Reflect.getMetadata('design:paramtypes', target, methodName);
				doesn't seem to be working in the test environment, so the paramtypes array is always undefined
				TODO: find a better solution
			 */
			type: paramtypes && paramtypes[index]
		});
		Reflect.defineMetadata('tsswagger:method-parameters', methodParameters, target);
	};
}

type ParameterName = string;
type CreateParamDecoratorFunctionArg = IMethodParameterBase | ParameterName;

// TODO: use openApi 3 requestBody for 'body'
export const createParamDecorator = (inKey: 'path' | 'query' | 'body') => (
	opts: CreateParamDecoratorFunctionArg
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
}

/**
 * Decorator that annotate a controller.
 * It allows setting the basepath, resourceSchema, etc
 * @param args
 */
export function controller(args?: IControllerDecoratorArgs): Function {
	return function(target: Object) {
		// define new metadata props
		Reflect.defineMetadata('tsswagger:controller', args, target);
	};
}
