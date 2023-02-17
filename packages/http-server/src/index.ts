/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import type { Chain, InjectOptions } from 'light-my-request';

export * from './HttpServerModule';
export * as httpErrors from './httpErrors';
export * from './decorators';
export * from './AjvValidator';
export * from './types';

declare module '@davinci/core' {
	interface LocalVars {
		injectHttpRequest: (injectOptions: InjectOptions, preferredHttpModule?: string) => Chain;
	}
}
