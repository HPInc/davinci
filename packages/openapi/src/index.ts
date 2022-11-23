/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

export * from './OpenAPIModule';

declare module '@davinci/http-server' {
	interface MethodDecoratorOptions {
		/**
		 * specify an operationId explicitly.
		 * Otherwise, the operationId will be inferred by
		 * controller + method names
		 *
		 */
		operationId?: string;

		/**
		 * if set to 'true' hides the endpoint from the
		 * generated OpenAPI document
		 *
		 * @defaultValue false
		 */
		hidden?: boolean;
	}

	interface ControllerDecoratorOptions {
		/**
		 * Defines the OpenAPI tags for the endpoint
		 */
		tags?: Array<string>;
	}
}
