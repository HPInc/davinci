import { Document, model } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import OrderSchema from './order.schema';
import { Context } from '../../types';

const { generateSchema, beforeRead, beforeWrite, afterDelete } = mgoose;

const schema = generateSchema(OrderSchema);

beforeRead<Context>(schema, ({ query, context }) => {
	// inject accountId before persisting into DB
	if (!context) return;

	const currentQuery = query.getQuery();
	query.setQuery({ ...currentQuery, accountId: context.accountId });
});

beforeWrite<Context, OrderSchema>(schema, ({ query, doc, context }) => {
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

const Order = model<OrderSchema & Document>('Order', schema, 'orders');

export default Order;
