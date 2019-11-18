import { TypeValue, TypeValueFactory, Maybe } from '@davinci/reflector';

export interface ISwaggerDefinition {
	title?: string;
	type?: string;
	description?: string;
	format?: string;
	properties?: { [key: string]: ISwaggerDefinition };
	items?: ISwaggerDefinition;
	required?: string[];
	$ref?: string;
}

export interface ISwaggerDefinitions {
	[key: string]: ISwaggerDefinition;
}

export interface ISchema {
	$ref?: string;
	type?: string;
	[key: string]: any;
}

export interface IMethodParameterBase {
	name?: string;
	description?: string;
	required?: boolean;
	schema?: ISchema;
	responses?: {
		[key: number]: {
			description?: string;
			schema?: ISchema;
		};
	};
}

export interface IMethodParameter extends IMethodParameterBase {
	in: 'body' | 'path' | 'query';
}

export type Verb = 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete';

export interface PathsDefinition {
	[key: string]: {
		[key in Verb]: {
			summary: string;
			operationId: string;
			parameters: IMethodParameter[];
			consumes: string[];
			produces: string[];
			tags: string[];
			responses?: {
				[key: number]: {
					description: string;
				};
			};
		};
	};
}

export interface PathsValidationOptions {
	[key: string]: {
		[key in Verb]: MethodValidation;
	};
}

/**
 * Something
 * @param type - Explicitly passed type
 * @param rawType - The raw json schema type
 * @param typeFactory - Function that returns a type (useful for lazily evaluated types)
 * @param required - Whether the property is required or not
 */
export interface IPropDecoratorOptions {
	type?: TypeValue;
	rawSchemaOptions?: unknown;
	typeFactory?: TypeValueFactory;
	required?: boolean;
}

export type IPropDecoratorOptionsFactory = () => Maybe<IPropDecoratorOptions>;

export interface IPropDecoratorMetadata {
	key: string;
	optsFactory?: IPropDecoratorOptionsFactory;
}

export interface IMethodResponseOutput {
	description?: string;
	schema?: { $ref: string };
}

export interface IMethodResponses {
	[key: number]: Function | IMethodResponseOutput | ((string) => IMethodResponseOutput);
}

export interface MethodValidation {
	disable?: boolean;
	partial?: boolean;
}

export interface IMethodDecoratorOptions {
	path: string;
	summary: string;
	description?: string;
	responses?: IMethodResponses;
	validation?: MethodValidation;
}

export interface IMethodDecoratorMetadata {
	path: string;
	summary: string;
	description?: string;
	responses?: IMethodResponses;
	handler: Function;
	verb: Verb;
	methodName: string;
	validation?: MethodValidation;
}
