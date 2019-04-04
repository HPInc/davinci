import 'reflect-metadata';
// import Reflect from '../../../lib/Reflect';
import _ from 'lodash';
import { MethodParameter } from '../types';

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

const createMethodDecorator = verb =>
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
				doesn't seem to be working in the test enviroment.
				TODO: find a better solution
			 */
			type: paramtypes && paramtypes[index]
		});
		Reflect.defineMetadata('tsswagger:method-parameters', methodParameters, target);
	};
}

export type IControllerDecoratorArgs = {
	basepath?: string;
	excludedMethods?: string[];
};

export function controller(args?: IControllerDecoratorArgs): Function {
	return function(target: Object) {
		// define new metadata props
		Reflect.defineMetadata('tsswagger:controller', args, target);
	};
}

export function getControllerMetadata(target: Object) {
	return Reflect.getMetadata('tsswagger:controller', target);
}
