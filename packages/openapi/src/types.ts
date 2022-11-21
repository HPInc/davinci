/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassType } from '@davinci/reflector';
import { OpenAPIV3 } from 'openapi-types';

export type MethodResponseItem =
	| OpenAPIV3.ResponseObject
	| (Omit<OpenAPIV3.ResponseObject, 'content'> & { content: ClassType | Array<ClassType> })
	| (Omit<OpenAPIV3.ResponseObject, 'content'> & {
			content: { [media: string]: ClassType | Array<ClassType> };
	  })
	| (Omit<OpenAPIV3.ResponseObject, 'content'> & {
			content: {
				[media: string]: Omit<OpenAPIV3.MediaTypeObject, 'schema'> & { schema?: ClassType | Array<ClassType> };
			};
	  })
	| ClassType
	| Array<ClassType>;

export interface MethodResponses {
	[key: number | string]: MethodResponseItem | Array<MethodResponseItem>;
}
