/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

export * from './OpenAPIModule';

declare module '@davinci/http-server' {
	interface MethodDecoratorOptions {
		/**
		 * if set to 'true' hides the endpoint from the
		 * generated OpenAPI document
		 *
		 * @defaultValue false
		 */
		hidden?: boolean;
	}
}
