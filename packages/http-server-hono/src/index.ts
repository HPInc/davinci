/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import './fetch-polyfill';
import { Hono } from 'hono';

export * from './HonoHttpServer';

declare module '@davinci/core' {
	interface LocalVars {
		fetch: InstanceType<typeof Hono>['fetch'];
	}
}
