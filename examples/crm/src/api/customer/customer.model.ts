import { Document, model } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import CustomerSchema from './customer.schema';
import { Context } from '../../types';

const { generateSchema, beforeRead, beforeWrite, beforeDelete } = mgoose;

const schema = generateSchema(CustomerSchema);

beforeRead<Context>(schema, ({ query, context }) => {
	if (context) {
		const currentQuery = query.getQuery();
		query.setQuery({ ...currentQuery, accountId: context.accountId });
	}
});

beforeWrite<Context, CustomerSchema>(schema, ({ doc, context }) => {
	// inject accountId before persisting into DB
	if (context) {
		doc.accountId = context.accountId;
	}
});

beforeDelete(schema, () => {
	// perform some cleanup
});

const Customer = model<CustomerSchema & Document>('Customer', schema, 'customers');

export default Customer;
