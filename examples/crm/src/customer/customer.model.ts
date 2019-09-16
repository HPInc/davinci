import { Document, model } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import CustomerSchema from './customer.schema';

const { generateSchema, beforeRead, beforeWrite, beforeDelete } = mgoose;

const schema = generateSchema(CustomerSchema);

beforeRead(schema, (mQuery, context) => {
	if (context) {
		const currentQuery = mQuery.getQuery();
		mQuery.setQuery({ ...currentQuery, accountId: context.accountId });
	}
});

beforeWrite(schema, (doc, context) => {
	if (context) {
		doc.accountId = context.accountId;
	}
});

beforeDelete(schema, (...args) => {
	console.log(...args);
});

const Customer = model<CustomerSchema & Document>('Customer', schema, 'customers');

export default Customer;
