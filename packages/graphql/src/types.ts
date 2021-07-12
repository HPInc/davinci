/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { GraphQLScalarType, GraphQLFieldResolver } from 'graphql';
import { ClassType, TypeValueFactory, Maybe } from '@davinci/reflector';

export type TypeValue = ClassType | GraphQLScalarType | Function | object | symbol;

export type OperationType = 'query' | 'mutation';

export interface IArgOptions {
	name?: string;
	required?: boolean;
	enum?: { [key: string]: string };
	partial?: boolean;
	type?: TypeValue;
	typeFactory?: TypeValueFactory;
}

export interface ITypeDecoratorOptions {
	name?: string;
	description?: string;
}

/**
 * @param type - The type of the field. Only Required for complex objects: Arrays, Objects
 */
export interface IFieldDecoratorOptions {
	type?: TypeValue;
	typeFactory?: TypeValueFactory;
	required?: boolean;
	description?: string;
	asInput?: boolean;
}

export interface IResolverDecoratorMetadata {
	name?: string;
	methodName: string;
	returnType: any;
	handler: Function;
}

export interface IExternalFieldResolverDecoratorMetadata extends IResolverDecoratorMetadata {
	prototype: any;
	resolverOf: any;
	fieldName: any;
}

export interface IFieldDecoratorOptionsFactoryArgs {
	isInput: boolean;
	operationType: OperationType;
	resolverMetadata?: IResolverDecoratorMetadata;
}

export type FieldDecoratorOptionsFactory = (args: IFieldDecoratorOptionsFactoryArgs) => Maybe<IFieldDecoratorOptions>;

export interface IFieldDecoratorMetadata {
	key: any;
	opts?: IFieldDecoratorOptions;
	optsFactory?: FieldDecoratorOptionsFactory;
}

export type SelectionSet<T> = { [P in keyof T]?: boolean | SelectionSet<T[P]> };

export type ResolverMiddleware<TSource = any, TContext = any> = GraphQLFieldResolver<TSource, TContext>;
