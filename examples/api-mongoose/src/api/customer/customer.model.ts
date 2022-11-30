/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { mgoose } from '@davinci/mongoose';
import { model } from 'mongoose';
import { Customer } from './customer.schema';

const schema = mgoose.generateSchema<Customer>(Customer);

mgoose.beforeWrite<{}, Customer>(schema, ({ query, doc }) => {
	if (doc) {
		doc.modifiedCount += doc.modifiedCount;
		return;
	}

	query.setUpdate({
		...query.getUpdate(),
		$inc: { modifiedCount: 1 }
	});
});

export const CustomerModel = model<Customer>('Customer', schema, 'customers');
