import { Document, model } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import CustomerSchema from './customer.schema';
import { Context } from '../../types';

const { generateSchema, beforeRead, beforeWrite, afterDelete } = mgoose;

const schema = generateSchema(CustomerSchema);

beforeRead<Context>(schema, ({ query, davinciCtx }) => {
	// inject accountId before persisting into DB
	if (!davinciCtx) return;

	const currentQuery = query.getQuery();
	query.setQuery({ ...currentQuery, accountId: davinciCtx.accountId });
});

beforeWrite<Context, CustomerSchema>(schema, ({ query, doc, davinciCtx }) => {
	// inject accountId before persisting into DB
	if (!davinciCtx) return;

	// required check for atomic operations
	if (doc) {
		doc.accountId = davinciCtx.accountId;
	} else {
		// @ts-ignore
		query.setUpdate({
			...query.getUpdate(),
			accountId: davinciCtx.accountId
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
