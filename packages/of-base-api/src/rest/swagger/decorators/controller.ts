import 'reflect-metadata';
import _ from 'lodash';

type MethodParameter = {
	name: string;
	in: 'body' | 'path' | 'query';
	description?: string;
	required?: boolean;
	schema?: { $ref: string };
};

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
	function({ path, summary, description }: MethodDecoratorOptions): Function {
		return function(target: Object, methodName: string | symbol) {
			// get the existing metadata props
			const methods = Reflect.getMetadata('tsswagger:methods', target) || [];
			methods.push({ path, verb, methodName, handler: target[methodName], summary, description });
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
	return function(target: Object, methodName: string | symbol, index) {
		// get the existing metadata props
		const methodParameters = Reflect.getMetadata('tsswagger:method-parameters', target) || [];
		const paramtypes = Reflect.getMetadata('design:paramtypes', target, methodName);
		const isAlreadySet: boolean = !!_.find(methodParameters, { methodName, index });
		if (isAlreadySet) return;

		methodParameters.unshift({
			target,
			methodName,
			handler: target[methodName],
			index,
			options,
			type: paramtypes[index]
		});
		Reflect.defineMetadata('tsswagger:method-parameters', methodParameters, target);
	};
}

type IControllerArgs = {
	basepath: string;
};

export function controller({ basepath }: IControllerArgs): Function {
	return function(target: Object) {
		// define new metadata props
		Reflect.defineMetadata('tsswagger:controller', { basepath }, target);
	};
}
