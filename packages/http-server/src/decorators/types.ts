/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { TypeValue } from '@davinci/reflector';

export type Verb = 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete';

export interface MethodValidation {
	disable?: boolean;
	partial?: boolean;
}

export interface IMethodResponseOutput {
	description?: string;
	schema?: { $ref: string };
}

export interface MethodResponses {
	[key: number]: Function | IMethodResponseOutput | ((string) => IMethodResponseOutput);
}

export interface MethodDecoratorOptions {
	path: string;
	summary?: string;
	description?: string;
	responses?: MethodResponses;
	validation?: MethodValidation;
	hidden?: boolean;
}

export interface MethodParameterBase {
	name?: string;
	type?: TypeValue;
	enum?: TypeValue[];
	description?: string;
	required?: boolean;
}

export interface MethodParameter extends MethodParameterBase {
	in: 'body' | 'path' | 'query' | 'header';
}

export interface ControllerDecoratorOptions {
	/**
	 * @deprecated Use `basePath`
	 */
	basepath?: string;
	basePath?: string;
}
