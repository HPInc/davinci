/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassType, DecoratorId, TypeValue } from '@davinci/reflector';
import type { OpenAPIV3 } from 'openapi-types';

export type Verb = 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete' | 'options';

export interface ValidationOptions {
	disabled?: boolean;
}

export type MethodResponseItemContent = Omit<OpenAPIV3.ResponseObject, 'content'> & {
	content: ClassType | Array<ClassType>;
};

export type MethodResponseItemContentMedia = Omit<OpenAPIV3.ResponseObject, 'content'> & {
	content: { [media: string]: ClassType | Array<ClassType> };
};

export type MethodResponseItemContentMediaSchema = Omit<OpenAPIV3.ResponseObject, 'content'> & {
	content: {
		[media: string]: Omit<OpenAPIV3.MediaTypeObject, 'schema'> & { schema?: ClassType | Array<ClassType> };
	};
};

export type MethodResponseItem =
	| OpenAPIV3.ResponseObject
	| MethodResponseItemContent
	| MethodResponseItemContentMedia
	| MethodResponseItemContentMediaSchema
	| ClassType
	| Array<ClassType>;

export interface MethodResponses {
	[key: number | string]: MethodResponseItem | Array<MethodResponseItem>;
}

export interface MethodDecoratorOptions {
	path: string;
	summary?: string;
	description?: string;
	responses?: MethodResponses;
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
	validation?: ValidationOptions;
}

export interface ParameterDecoratorOptions extends ParameterDecoratorBaseOptions {
	in: 'body' | 'path' | 'query' | 'header';
}

export interface ParameterDecoratorMetadata {
	[DecoratorId]: string;
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
