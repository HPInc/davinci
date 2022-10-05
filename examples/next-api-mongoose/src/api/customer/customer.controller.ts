/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { route } from '@davinci/http-server';
import { Customer, CustomerPartial } from './customer.schema';
import { CustomerModel } from './customer.model';

@route.controller({
	basePath: '/api/customers'
})
export default class CustomerController {
	@route.get({ path: '/' })
	list() {
		return CustomerModel.find();
	}

	@route.post({ path: '/' })
	async create(@route.body({ required: true }) data: Customer) {
		const customer = await CustomerModel.create(data);

		return { success: true, data: customer };
	}

	@route.get({ path: '/:id' })
	getOne(@route.path() id: string) {
		return CustomerModel.findById(id);
	}

	@route.patch({ path: '/:id' })
	async patch(@route.path() id: string, @route.body({ required: true }) data: CustomerPartial) {
		const customer = await CustomerModel.findOneAndUpdate({ _id: id }, data, { new: true });

		return { success: true, data: customer };
	}
}
