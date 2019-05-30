import { model } from 'mongoose';
import { mgoose } from '@substrate/mongoose';
import CustomerSchema from './customer.schema';

const { generateSchema, beforeRead, beforeWrite, beforeDelete } = mgoose;

const schema = generateSchema(CustomerSchema);

beforeRead(schema, (mQuery, context) => {
	const currentQuery = mQuery.getQuery();
	mQuery.setQuery({ ...currentQuery, accountId: context.accountId });
});

beforeWrite(schema, (doc, context) => {
	doc.accountId = context.accountId;
});

beforeDelete(schema, (...args) => {
	console.log(...args);
});

const Customer = model('Customer', schema, 'customers');

export default Customer;
