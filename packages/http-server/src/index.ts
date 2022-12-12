/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { Chain, InjectOptions } from 'light-my-request';

export * from './HttpServerModule';
export * as httpErrors from './httpErrors';
export * from './decorators';
export * from './AjvValidator';
export * from './types';

declare module '@davinci/core' {
	interface Commands {
		injectHttpRequest: (injectOptions: InjectOptions, preferredHttpModule?: string) => Chain;
	}
}
