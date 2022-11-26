/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
// @ts-ignore
import * as core from '@davinci/core';
import { Request } from './types';

declare module '@davinci/core' {
	interface App {
		injectHttpRequest: <Req extends Request>(req: Req) => Promise<any>;
	}
}
