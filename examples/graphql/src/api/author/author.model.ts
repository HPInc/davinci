import { Document, model } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import AuthorSchema from './author.schema';
import { Context } from '../../types';

const { generateSchema, beforeRead, beforeWrite, beforeDelete } = mgoose;

const schema = generateSchema(AuthorSchema);

beforeRead<Context>(schema, ({ query, davinciContext }) => {
	if (davinciContext) {
		const currentQuery = query.getQuery();
		query.setQuery({ ...currentQuery, accountId: davinciContext.accountId });
	}
});

beforeWrite<Context, AuthorSchema>(schema, ({ doc, davinciContext }) => {
	// inject accountId before persisting into DB
	if (davinciContext) {
		doc.accountId = davinciContext.accountId;
	}
});

beforeDelete(schema, () => {
	// perform some cleanup
});

const Author = model<AuthorSchema & Document>('Author', schema, 'authors');

export default Author;
