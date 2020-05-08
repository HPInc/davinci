import { Schema } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import { graphql, queryHelpers } from '@davinci/graphql';
import { AuthorSchema } from '../index';
import { requiredForMutations } from '../../lib/schemaUtils';

@mgoose.index({ isbn: 1 }, { unique: true })
export default class Book {
	@graphql.field()
	id: string;

	@mgoose.prop({ required: true })
	@graphql.field(requiredForMutations)
	title: string;

	@graphql.field()
	isbn: string;

	@mgoose.prop({ type: Schema.Types.ObjectId })
	@graphql.field()
	authorIds: string;

	@graphql.field({ typeFactory: () => [AuthorSchema] })
	authors: AuthorSchema[];

	@mgoose.prop({ type: Schema.Types.ObjectId })
	@graphql.field()
	accountId: string;
}

export class BookFilter extends queryHelpers.withOperators(Book) {}

export class BookPagination extends queryHelpers.withPagination() {}
