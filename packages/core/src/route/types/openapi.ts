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
		}
	};
}
