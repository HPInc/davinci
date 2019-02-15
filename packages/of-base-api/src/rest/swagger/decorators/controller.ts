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

export function get({ path, summary, description }: MethodDecoratorOptions): Function {
	return function(target: Object, methodName: string | symbol) {
		// get the existing metadata props
		const methods = Reflect.getMetadata('tsswagger:methods', target) || [];
		methods.push({ path, verb: 'get', methodName, handler: target[methodName], summary, description });
		// define new metadata methods
		Reflect.defineMetadata('tsswagger:methods', methods, target);
	};
}

export function param(options: MethodParameter): Function {
	return function(target: Object, methodName: string | symbol, index) {
		// get the existing metadata props
		const methodParameters = Reflect.getMetadata('tsswagger:method-parameters', target) || [];
		const isAlreadySet: boolean = !!_.find(methodParameters, { methodName, index });
		if (isAlreadySet) return;
		methodParameters.push({ target, methodName, handler: target[methodName], index, options });
		Reflect.defineMetadata('tsswagger:method-parameters', methodParameters, target);
	};
}

interface IControllerArgs {
	basepath: string;
}

export function controller({ basepath }: IControllerArgs): Function {
	return function(target: Object) {
		// define new metadata props
		Reflect.defineMetadata('tsswagger:controller', { basepath }, target);
	};
}
