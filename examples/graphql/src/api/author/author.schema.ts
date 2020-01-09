import { Schema } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import { graphql } from '@davinci/graphql';
import { BookSchema } from '../index';

class AuthorPhone {
	@mgoose.prop()
	@graphql.field()
	number: string;
	@mgoose.prop()
	isPrimary: boolean;
}

class BirthType {
	@mgoose.prop()
	@graphql.field()
	city: string;
}

@mgoose.index({ firstname: 1, lastname: 1 }, { unique: true })
export default class Author {
	@graphql.field()
	id: string;

	@mgoose.prop({ required: true })
	@graphql.field({ required: true, asInput: false })
	firstname: string;

	@mgoose.prop({ required: true })
	@graphql.field({ required: true, asInput: false })
	lastname: string;

	@mgoose.prop()
	@graphql.field()
	age: number;

	@mgoose.prop()
	@graphql.field()
	weight: string;

	@mgoose.prop({ type: [AuthorPhone] })
	@graphql.field({ type: [AuthorPhone] })
	phones: AuthorPhone[];

	@mgoose.prop({ type: Schema.Types.ObjectId })
	@graphql.field()
	accountId: string;

	@mgoose.prop({ type: Date })
	@graphql.field({ type: Date })
	startDate: string;

	@mgoose.prop()
	@graphql.field()
	birth: BirthType;

	@mgoose.prop({ type: Schema.Types.ObjectId })
	// @mgoose.populate({ name: 'file', opts: { ref: 'File', foreignField: '_id', justOne: true } })
	@graphql.field()
	fileId: string;

	@graphql.field({ typeFactory: () => [BookSchema] })
	books: BookSchema[];

	@mgoose.method()
	static getSomething() {}

	@mgoose.method()
	getPrototypeSomething() {}
}

export class AuthorQuery extends Author {
	@graphql.field({ typeFactory: () => [Author] })
	and: [Author];
}
