import _ from 'lodash';
import { MethodParameter, MethodParameterBase } from '../types';

type MethodResponseOutput = {
	description?: string;
	schema?: { $ref: string };
};

type MethodResponses = {
	[key: number]: MethodResponseOutput | ((string) => MethodResponseOutput);
};

type MethodDecoratorOptions = {
	path: string;
	summary: string;
	description?: string;
	responses?: MethodResponses;
};

export const createMethodDecorator = verb =>
	function({ path, summary, description, responses }: MethodDecoratorOptions): Function {
		return function(target: Object, methodName: string | symbol) {
			// get the existing metadata props
			const methods = Reflect.getMetadata('tsswagger:methods', target) || [];
			methods.unshift({ path, verb, methodName, summary, description, responses, handler: target[methodName] });
			// define new metadata methods
			Reflect.defineMetadata('tsswagger:methods', methods, target);
		};
	};

export const get = createMethodDecorator('get');
export const post = createMethodDecorator('post');
export const put = createMethodDecorator('put');
export const patch = createMethodDecorator('patch');
export const del = createMethodDecorator('delete');
export const head = createMethodDecorator('head');

export function param(options: MethodParameter): Function {
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
type CreateParamDecoratorFunctionArg = MethodParameterBase | ParameterName;

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

export function controller(args?: IControllerDecoratorArgs): Function {
	return function(target: Object) {
		// define new metadata props
		Reflect.defineMetadata('tsswagger:controller', args, target);
	};
}
