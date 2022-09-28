import { Document, model } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import AuthorSchema from './author.schema';
import { Context } from '../../types';

const { generateSchema, beforeRead, beforeWrite, beforeDelete } = mgoose;

const schema = generateSchema(AuthorSchema);

beforeRead<Context>(schema, ({ query, davinciCtx }) => {
	if (davinciCtx) {
		const currentQuery = query.getQuery();
		query.setQuery({ ...currentQuery, accountId: davinciCtx.accountId });
	}
});

beforeWrite<Context, AuthorSchema>(schema, ({ doc, davinciCtx }) => {
	// inject accountId before persisting into DB
	if (davinciCtx) {
		doc.accountId = davinciCtx.accountId;
	}
});

beforeDelete(schema, () => {
	// perform some cleanup
});

const Author = model<AuthorSchema & Document>('Author', schema, 'authors');

export default Author;
