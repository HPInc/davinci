/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { httpErrors, route } from '@davinci/http-server';
import { Customer, CustomerList, CustomerPartial } from './customer.schema';

const customers: Array<Customer> = [{ id: '123', firstname: 'John', lastname: 'Doe' }];

@route.controller({
	basePath: '/api/customers'
})
export default class CustomerController {
	@route.get({ path: '/', responses: { 200: CustomerList } })
	async list(): Promise<CustomerList> {
		return {
			data: [{ firstname: 'John', lastname: 'Doe' }]
		};
	}

	@route.post({ path: '/', responses: { 200: Customer } })
	async create(@route.body({ required: true }) data: Customer) {
		return { success: true, data };
	}

	@route.get({ path: '/:id', responses: { 200: Customer } })
	getOne(@route.path() id: string) {
		const customer = customers.find(c => c.id === id);
		if (!customer) {
			throw new httpErrors.NotFound();
		}

		return customer;
	}

	@route.patch({ path: '/:id', responses: { 200: Customer } })
	async patch(@route.path() id: string, @route.body({ required: true }) data: CustomerPartial) {
		const customer = customers.find(c => c.id === id);
		if (!customer) {
			throw new httpErrors.NotFound();
		}

		return data;
	}
}
