import { Document, model } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import BookSchema from './book.schema';
import { Context } from '../../types';

const { generateSchema, beforeRead, beforeWrite, beforeDelete } = mgoose;

const schema = generateSchema(BookSchema);

beforeRead<Context>(schema, ({ query, context }) => {
	if (context) {
		const currentQuery = query.getQuery();
		query.setQuery({ ...currentQuery, accountId: context.accountId });
	}
});

beforeWrite<Context, BookSchema>(schema, ({ doc, context }) => {
	// inject accountId before persisting into DB
	if (context) {
		doc.accountId = context.accountId;
	}
});

beforeDelete(schema, () => {
	// perform some cleanup
});

const Book = model<BookSchema & Document>('Book', schema, 'books');

export default Book;
