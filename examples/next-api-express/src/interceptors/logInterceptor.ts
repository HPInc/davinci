/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { HttpServerInterceptor } from '@davinci/http-server';
import { Request, Response } from 'express';
import { Context } from '../types';

export const logInterceptor: HttpServerInterceptor<{
	Context: Context;
	Request: Request;
	Response: Response;
}> = (next, interceptorBag) => {
	const { route, context } = interceptorBag;
	console.log('The route is', route);
	console.log('The account id is', context.accountId);

	return next();
};
