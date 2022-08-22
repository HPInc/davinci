/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassType, TypeValue } from '@davinci/reflector';

export type Verb = 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete' | 'options';

export interface MethodValidation {
	disable?: boolean;
	partial?: boolean;
}

export interface MethodResponseOutput {
	description?: string;
	schema?: { $ref: string };
}

export interface MethodResponses {
	[key: number]: MethodResponseOutput | ClassType | (MethodResponseOutput | ClassType[]);
}

export interface MethodDecoratorOptions {
	path: string;
	summary?: string;
	description?: string;
	responses?: MethodResponses;
	validation?: MethodValidation;
	hidden?: boolean;
}

export interface MethodDecoratorMetadata {
	module: string;
	type: string;
	verb: Verb;
	options: MethodDecoratorOptions;
}

export interface ParameterDecoratorBaseOptions {
	name?: string;
	type?: TypeValue;
	enum?: TypeValue[];
	description?: string;
	required?: boolean;
}

export interface ParameterDecoratorOptions extends ParameterDecoratorBaseOptions {
	in: 'body' | 'path' | 'query' | 'header';
}

export interface ParameterDecoratorMetadata {
	module: string;
	type: string;
	options: ParameterDecoratorOptions;
}

export interface ControllerDecoratorOptions {
	/**
	 * @deprecated Use `basePath`
	 */
	basepath?: string;
	basePath?: string;
}

export interface ControllerDecoratorMetadata {
	module: string;
	type: string;
	options: ControllerDecoratorOptions;
}
