/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import _ from 'lodash';
import { Reflector, ReturnTypeFunc, ReturnTypeFuncValue, ClassType } from '@davinci/reflector';
import {
	IArgOptions,
	ITypeDecoratorOptions,
	IFieldDecoratorOptions,
	IFieldDecoratorMetadata,
	FieldDecoratorOptionsFactory,
	IFieldDecoratorOptionsFactoryArgs,
	IResolverDecoratorMetadata,
	ResolverMiddleware,
	IExternalFieldResolverDecoratorMetadata
} from '../types';

/**
 * It annotates a variable as schema prop
 * @param options
 */
export function type(options?: ITypeDecoratorOptions): ClassDecorator {
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
export function field(opts?: IFieldDecoratorOptions | FieldDecoratorOptionsFactory): PropertyDecorator {
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
export const query = (returnType: ReturnTypeFunc | ReturnTypeFuncValue, name?: string): MethodDecorator => {
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
export const mutation = (returnType: ReturnTypeFunc | ReturnTypeFuncValue, name?: string): MethodDecorator => {
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

/**
 * Decorator that annotate a method parameter
 * @param options
 */
export function arg(options?: IArgOptions): ParameterDecorator {
	return function(prototype: object, methodName: string, index) {
		// get the existing metadata props
		const methodParameters = Reflector.getMetadata('davinci:graphql:args', prototype.constructor) || [];
		const paramtypes = Reflector.getMetadata('design:paramtypes', prototype, methodName);
		const argType = options?.type ? options?.type : paramtypes?.[index];

		const isAlreadySet = !!_.find(methodParameters, { methodName, index });
		if (isAlreadySet) return;

		let n = options?.name;

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
			type: argType
		});
		Reflector.defineMetadata('davinci:graphql:args', methodParameters, prototype.constructor);
	};
}

// resolverOf BookSchema,
// returnType [AuthorSchema]
export function fieldResolver<T = {}>(
	resolverOf: ClassType,
	fieldName: keyof T,
	returnType: ReturnTypeFuncValue
): MethodDecorator {
	return function(prototype: object, methodName: string) {
		// get the existing metadata props
		const resolvers: IExternalFieldResolverDecoratorMetadata[] =
			Reflector.getMetadata('davinci:graphql:field-resolvers', resolverOf.prototype.constructor) || [];
		const isAlreadySet = !!_.find(resolvers, { methodName, fieldName });
		if (isAlreadySet) return;

		resolvers.unshift({
			prototype,
			methodName,
			resolverOf,
			fieldName,
			returnType,
			handler: prototype[methodName]
		});
		Reflector.defineMetadata('davinci:graphql:field-resolvers', resolvers, resolverOf.prototype.constructor);
	};
}

export function info(): ParameterDecorator {
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

export function selectionSet(): ParameterDecorator {
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

export function parent(): ParameterDecorator {
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
): ClassDecorator & MethodDecorator => {
	return function(target: Record<string, any> | Function, methodName?: string) {
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

		const middlewares = (Reflector.getMetadata('davinci:graphql:middleware', realTarget) || [])
			.concat(args)
			.sort((a, b) => {
				if (a.isControllerMw && !b.isControllerMw) return -1;
				if (!a.isControllerMw && b.isControllerMw) return 1;

				return 0;
			});

		// define new metadata methods
		Reflector.defineMetadata('davinci:graphql:middleware', middlewares, realTarget);
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
