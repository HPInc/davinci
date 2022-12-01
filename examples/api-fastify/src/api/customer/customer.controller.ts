/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { route } from '@davinci/http-server';
import { context, interceptor } from '@davinci/core';
import { healthCheck } from '@davinci/health-checks';
import { Customer } from './customer.schema';
import { logInterceptor } from '../../interceptors/logInterceptor';
import { Context } from '../../types';

@interceptor(logInterceptor)
@route.controller({
	basePath: '/api/customers'
})
export default class CustomerController {
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

	@route.post({ path: '/', responses: { 201: Customer } })
	create(@route.body({ required: true }) data: Customer) {
		return { success: true, data };
	}

	@route.get({ path: '/' })
	getAll(@route.query() query: Customer) {
		return { query };
	}

	// this health check function is on the controller just for
	// illustration purposes. Realistically it should be registered within a module
	@healthCheck('liveness')
	liveness() {
		return { success: true };
	}
}
