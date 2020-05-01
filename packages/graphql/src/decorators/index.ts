/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import _ from 'lodash';
import { Reflector, ReturnTypeFunc, ReturnTypeFuncValue, ClassType } from '@davinci/reflector';
import {
	ITypeDecoratorOptions,
	IFieldDecoratorOptions,
	IFieldDecoratorMetadata,
	FieldDecoratorOptionsFactory,
	IFieldDecoratorOptionsFactoryArgs,
	IResolverDecoratorMetadata,
	ResolverMiddleware
} from '../types';

/**
 * It annotates a variable as schema prop
 * @param options
 */
export function type(options?: ITypeDecoratorOptions) {
	return function(target: Function): void {
		const metadata: ITypeDecoratorOptions = options;
		Reflector.defineMetadata('davinci:graphql:types', metadata, target);
	};
}

// for future use
const DEFAULT_FIELD_OPTIONS = {};

/**
 * It annotates a variable as schema prop
 * @param opts
 */
export function field(opts?: IFieldDecoratorOptions | FieldDecoratorOptionsFactory) {
	return function(prototype: object, key: string | symbol): void {
		const optsFactory = (args: IFieldDecoratorOptionsFactoryArgs) => {
			const options = _.merge({}, DEFAULT_FIELD_OPTIONS, typeof opts === 'function' ? opts(args) : opts);
			if (!options.type && !options.typeFactory) {
				options.type = Reflector.getMetadata('design:type', prototype, key);
			}

			return options;
		};
		const metadata: IFieldDecoratorMetadata = { key, optsFactory };
		Reflector.pushMetadata('davinci:graphql:fields', metadata, prototype.constructor);
	};
}

/**
 * Decorator that annotate a query method
 * @param returnType - The return type or class of the resolver
 * @param name - Optional name
 */
export const query = (returnType: ReturnTypeFunc | ReturnTypeFuncValue, name?: string): Function => {
	return function(prototype: object, methodName: string) {
		const metadata: IResolverDecoratorMetadata = {
			name,
			methodName,
			returnType,
			handler: prototype[methodName]
		};
		Reflector.pushMetadata('davinci:graphql:queries', metadata, prototype.constructor);
	};
};

/**
 * Decorator that annotate a mutation method
 * @param returnType - The return type or class of the resolver
 * @param name - Optional name
 */
export const mutation = (returnType: ReturnTypeFunc | ReturnTypeFuncValue, name?: string): Function => {
	return function(prototype: object, methodName: string) {
		const metadata: IResolverDecoratorMetadata = {
			name,
			methodName,
			returnType,
			handler: prototype[methodName]
		};
		Reflector.pushMetadata('davinci:graphql:mutations', metadata, prototype.constructor);
	};
};

export interface IArgOptions {
	required?: boolean;
	enum?: { [key: string]: string };
	partial?: boolean;
}

/**
 * Decorator that annotate a method parameter
 * @param name
 * @param options
 */
export function arg(name?, options?: IArgOptions): Function {
	return function(prototype: object, methodName: string, index) {
		// get the existing metadata props
		const methodParameters = Reflector.getMetadata('davinci:graphql:args', prototype.constructor) || [];
		const paramtypes = Reflector.getMetadata('design:paramtypes', prototype, methodName);
		const isAlreadySet = !!_.find(methodParameters, { methodName, index });
		if (isAlreadySet) return;

		let n = name;

		if (!n) {
			const methodParameterNames = Reflector.getParameterNames(prototype[methodName]);
			n = methodParameterNames[index];
		}

		methodParameters.unshift({
			methodName,
			index,
			name: n,
			opts: options,
			handler: prototype[methodName],
			type: paramtypes && paramtypes[index]
		});
		Reflector.defineMetadata('davinci:graphql:args', methodParameters, prototype.constructor);
	};
}

// resolverOf BookSchema,
// returnType [AuthorSchema]
export function fieldResolver<T = {}>(
	resolverOf: ClassType,
	fieldName: keyof T,
	returnType: ClassType | ClassType[]
): Function {
	return function(prototype: object, methodName: string, index) {
		// get the existing metadata props
		const methodParameters =
			Reflector.getMetadata('davinci:graphql:field-resolvers', resolverOf.prototype.constructor) || [];
		const paramtypes = Reflector.getMetadata('design:paramtypes', prototype, methodName);
		const isAlreadySet = !!_.find(methodParameters, { methodName, index });
		if (isAlreadySet) return;

		methodParameters.unshift({
			prototype,
			methodName,
			resolverOf,
			index,
			fieldName,
			returnType,
			// name,
			// opts: options,
			handler: prototype[methodName],
			type: paramtypes && paramtypes[index]
		});
		Reflector.defineMetadata('davinci:graphql:field-resolvers', methodParameters, resolverOf.prototype.constructor);
	};
}

export function info() {
	return function(prototype: object, methodName: string, index) {
		// get the existing metadata props
		const methodParameters = Reflector.getMetadata('davinci:graphql:args', prototype.constructor) || [];
		const isAlreadySet = !!_.find(methodParameters, { methodName, index });
		if (isAlreadySet) return;

		methodParameters.unshift({
			methodName,
			index,
			handler: prototype[methodName],
			type: 'info'
		});
		Reflector.defineMetadata('davinci:graphql:args', methodParameters, prototype.constructor);
	};
}

export function selectionSet() {
	return function(prototype: object, methodName: string, index) {
		// get the existing metadata props
		const methodParameters = Reflector.getMetadata('davinci:graphql:args', prototype.constructor) || [];
		const isAlreadySet = !!_.find(methodParameters, { methodName, index });
		if (isAlreadySet) return;

		methodParameters.unshift({
			methodName,
			index,
			handler: prototype[methodName],
			type: 'selectionSet'
		});
		Reflector.defineMetadata('davinci:graphql:args', methodParameters, prototype.constructor);
	};
}

export function parent() {
	return function(prototype: object, methodName: string, index) {
		// get the existing metadata props
		const methodParameters = Reflector.getMetadata('davinci:graphql:args', prototype.constructor) || [];
		const isAlreadySet = !!_.find(methodParameters, { methodName, index });
		if (isAlreadySet) return;

		methodParameters.unshift({
			methodName,
			index,
			handler: prototype[methodName],
			type: 'parent'
		});
		Reflector.defineMetadata('davinci:graphql:args', methodParameters, prototype.constructor);
	};
}

type Stage = 'before' | 'after';

const middleware = <TSource = any, TContext = any>(
	middlewareFunction: ResolverMiddleware<TSource, TContext>,
	stage: Stage = 'before'
): Function => {
	return function(target: Record<string, any> | Function, methodName: string) {
		const args: {
			middlewareFunction: Function;
			stage: Stage;
			handler?: Function;
			isControllerMw?: boolean;
		} = { middlewareFunction, stage };

		let realTarget = target;
		if (typeof target === 'object' && target[methodName]) {
			args.handler = target[methodName];
			realTarget = target.constructor;
		} else {
			args.isControllerMw = true;
		}

		// define new metadata methods
		Reflector.unshiftMetadata('davinci:graphql:middleware', args, realTarget);

		return target;
	};
};

/**
 * Decorator that allow to specify a `before` middlewares per controller method basis
 * @param middlewareFunction
 */
middleware.before = <TSource, TContext>(middlewareFunction: ResolverMiddleware<TSource, TContext>) =>
	middleware(middlewareFunction, 'before');

/**
 * Decorator that allow to specify a `after` middlewares per controller method basis
 * @param middlewareFunction
 */
middleware.after = <TSource, TContext>(middlewareFunction: ResolverMiddleware<TSource, TContext>) =>
	middleware(middlewareFunction, 'after');

export { middleware };
