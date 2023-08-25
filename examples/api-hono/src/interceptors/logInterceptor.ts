/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { HttpServerInterceptor } from '@davinci/http-server';
import { Context as HonoContext } from 'hono';
import { Context } from '../types';

export const logInterceptor: HttpServerInterceptor<{
	Context: Context;
	Request: HonoContext;
	Response: HonoContext;
}> = (next, interceptorBag) => {
	const { route, context } = interceptorBag;
	console.log('The route is', route);
	console.log('The account id is', context?.accountId);

	return next();
};
