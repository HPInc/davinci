/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassReflection, MethodReflection, TypeValue } from '@davinci/reflector';

export interface SubscribeOptions {
	name: string;
}

export type ParameterConfiguration =
	| {
			name: string;
			source: 'message' | 'payload' | 'channel';
			value?: unknown;
			type?: TypeValue;
	  }
	| {
			source: 'context';
			reflection: { controllerReflection: ClassReflection; methodReflection: MethodReflection };
			value?: unknown;
	  };
