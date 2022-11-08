/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { route } from '@davinci/http-server';
import { context, interceptor } from '@davinci/core';
import { Context } from '../../types';
import { Customer } from './customer.schema';
import { healthCheck } from '@davinci/health-checks';

@route.controller({
	basePath: '/api/customers'
})
export default class CustomerController {
	@interceptor<{ Context: Context }>((next, { handlerArgs, context, state, module }) => {
		console.log(handlerArgs, context, state, module);
		return next();
	})
	@route.get({ path: '/hello', summary: 'That is a hello method' })
	hello(
		@route.query({ required: true }) firstname: string,
		@route.query() age: number,
		@route.query() customer: Customer,
		@route.header({ name: 'x-accountid' }) accountId: string,
		@context() ctx: Context
	) {
		return { success: true, firstname, age, customer, accountId, ctx };
	}

	@route.post({ path: '/' })
	create(@route.body({ required: true }) data: Customer) {
		return { success: true, data };
	}

	@route.get({ path: '/' })
	getAll(@route.query() query: Customer) {
		return { query };
	}

	@healthCheck('liveness')
	liveness() {
		return { success: true };
	}
}
