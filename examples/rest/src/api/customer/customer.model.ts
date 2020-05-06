import { Document, model } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import CustomerSchema from './customer.schema';
import { Context } from '../../types';

const { generateSchema, beforeRead, beforeWrite, afterDelete } = mgoose;

const schema = generateSchema(CustomerSchema);

beforeRead<Context>(schema, ({ query, context }) => {
	// inject accountId before persisting into DB
	if (!context) return;

	const currentQuery = query.getQuery();
	query.setQuery({ ...currentQuery, accountId: context.accountId });
});

beforeWrite<Context, CustomerSchema>(schema, ({ query, doc, context }) => {
	// inject accountId before persisting into DB
	if (!context) return;

	// required check for atomic operations
	if (doc) {
		doc.accountId = context.accountId;
	} else {
		// @ts-ignore
		query.setUpdate({
			...query.getUpdate(),
			accountId: context.accountId
		});
	}
});

afterDelete<Context>(schema, ({ doc }) => {
	if (doc) {
		// perform some cleanup
	}
});

const Customer = model<CustomerSchema & Document>('Customer', schema, 'customers');

export default Customer;
