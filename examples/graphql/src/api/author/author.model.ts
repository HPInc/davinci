import { Document, model } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import AuthorSchema from './author.schema';

const { generateSchema, beforeRead, beforeWrite, beforeDelete } = mgoose;

const schema = generateSchema(AuthorSchema);

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

const Author = model<AuthorSchema & Document>('Author', schema, 'authors');

export default Author;
