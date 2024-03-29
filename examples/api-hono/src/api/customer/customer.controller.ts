/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { route } from '@davinci/http-server';
import { context, interceptor } from '@davinci/core';
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
		@route.query() age: number,
		@route.query() customer: Customer,
		@route.header({ name: 'x-accountid' }) accountId: string,
		@context() ctx: Context
	) {
		return { success: true, age, customer, accountId, ctx };
	}

	@route.post({ path: '/', responses: { 201: Object } })
	create(@route.body({ required: true }) data: Customer) {
		return { success: true, data };
	}

	@route.get({ path: '/' })
	getAll(@route.query() where: Customer): { customers: Array<Customer>; where: Customer } {
		return {
			customers: [{ firstname: 'Mike', lastname: 'Bibby' }],
			where
		};
	}
}
