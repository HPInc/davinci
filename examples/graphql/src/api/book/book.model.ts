import { Document, model } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import BookSchema from './book.schema';

const { generateSchema, beforeRead, beforeWrite, beforeDelete } = mgoose;

const schema = generateSchema(BookSchema);

beforeRead(schema, (mQuery, context) => {
	const currentQuery = mQuery.getQuery();
	if (context) {
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

const Book = model<BookSchema & Document>('Book', schema, 'books');

export default Book;
