import _ from 'lodash';
import { Reflector } from '@davinci/reflector';
import {
	ReturnTypeFunc,
	ReturnTypeFuncValue,
	IFieldDecoratorOptions,
	IFieldDecoratorMetadata,
	ClassType
} from '../types';

/**
 * It annotates a variable as schema prop
 * @param opts
 */
export function field(opts?: IFieldDecoratorOptions) {
	return function(target: Object, key: string | symbol): void {
		const options = { ...opts };
		if (!options.type && !options.typeFactory) {
			options.type = Reflector.getMetadata('design:type', target, key);
		}
		const metadata: IFieldDecoratorMetadata = { key, opts: { ...options } };
		Reflector.pushMetadata('tsgraphql:fields', metadata, target);
	};
}

/**
 * Decorator that annotate a query method
 * @param returnType - The return type or class of the resolver
 * @param name - Optional name
 */
export const query = (returnType: ReturnTypeFunc | ReturnTypeFuncValue, name?: string): Function => {
	return function(target: Object, methodName: string | symbol) {
		const metadata = { name, methodName, returnType, handler: target[methodName] };
		Reflector.pushMetadata('tsgraphql:queries', metadata, target);
	};
};

/**
 * Decorator that annotate a mutation method
 * @param returnType - The return type or class of the resolver
 * @param name - Optional name
 */
export const mutation = (returnType: ReturnTypeFunc | ReturnTypeFuncValue, name?: string): Function => {
	return function(target: Object, methodName: string | symbol) {
		const metadata = { name, methodName, returnType, handler: target[methodName] };
		Reflector.pushMetadata('tsgraphql:mutations', metadata, target);
	};
};

export interface IArgOptions {
	required?: boolean;
	enum?: { [key: string]: string };
}

/**
 * Decorator that annotate a method parameter
 * @param name
 * @param options
 */
export function arg(name?, options?: IArgOptions): Function {
	return function(target: Object, methodName: string, index) {
		// get the existing metadata props
		const methodParameters = Reflector.getMetadata('tsgraphql:args', target) || [];
		const paramtypes = Reflector.getMetadata('design:paramtypes', target, methodName);
		const isAlreadySet = !!_.find(methodParameters, { methodName, index });
		if (isAlreadySet) return;

		methodParameters.unshift({
			target,
			methodName,
			index,
			name,
			opts: options,
			handler: target[methodName],
			type: paramtypes && paramtypes[index]
		});
		Reflector.defineMetadata('tsgraphql:args', methodParameters, target);
	};
}

// resolverOf BookSchema,
// returnType [AuthorSchema]
export function fieldResolver<T = {}>(
	resolverOf: ClassType,
	fieldName: keyof T,
	returnType: ClassType | ClassType[]
): Function {
	return function(target: Object, methodName: string, index) {
		// get the existing metadata props
		const methodParameters = Reflector.getMetadata('tsgraphql:field-resolvers', resolverOf.prototype) || [];
		const paramtypes = Reflector.getMetadata('design:paramtypes', target, methodName);
		const isAlreadySet = !!_.find(methodParameters, { methodName, index });
		if (isAlreadySet) return;

		methodParameters.unshift({
			target,
			methodName,
			resolverOf,
			index,
			fieldName,
			returnType,
			// name,
			// opts: options,
			handler: target[methodName],
			type: paramtypes && paramtypes[index]
		});
		Reflector.defineMetadata('tsgraphql:field-resolvers', methodParameters, resolverOf.prototype);
	};
}

export function info() {
	return function(target: Object, methodName: string, index) {
		// get the existing metadata props
		const methodParameters = Reflector.getMetadata('tsgraphql:args', target) || [];
		const isAlreadySet = !!_.find(methodParameters, { methodName, index });
		if (isAlreadySet) return;

		methodParameters.unshift({
			target,
			methodName,
			index,
			handler: target[methodName],
			type: 'info'
		});
		Reflector.defineMetadata('tsgraphql:args', methodParameters, target);
	};
}

export function selectionSet() {
	return function(target: Object, methodName: string, index) {
		// get the existing metadata props
		const methodParameters = Reflector.getMetadata('tsgraphql:args', target) || [];
		const isAlreadySet = !!_.find(methodParameters, { methodName, index });
		if (isAlreadySet) return;

		methodParameters.unshift({
			target,
			methodName,
			index,
			handler: target[methodName],
			type: 'selectionSet'
		});
		Reflector.defineMetadata('tsgraphql:args', methodParameters, target);
	};
}

export function parent() {
	return function(target: Object, methodName: string, index) {
		// get the existing metadata props
		const methodParameters = Reflector.getMetadata('tsgraphql:args', target) || [];
		const isAlreadySet = !!_.find(methodParameters, { methodName, index });
		if (isAlreadySet) return;

		methodParameters.unshift({
			target,
			methodName,
			index,
			handler: target[methodName],
			type: 'parent'
		});
		Reflector.defineMetadata('tsgraphql:args', methodParameters, target);
	};
}

export interface IResolverDecoratorArgs {
	excludedMethods?: string[];
	resourceSchema?: Function;
}

/**
 * Decorator that annotate a controller.
 * It allows setting the basepath, resourceSchema, etc
 * @param args
 */
export function resolver(args?: IResolverDecoratorArgs): Function {
	return function(target: Object) {
		// define new metadata props
		Reflector.defineMetadata('tsgraphql:resolver', args, target);
	};
}
