import { Schema } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import { graphql } from '@davinci/graphql';

class CustomerPhone {
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
export default class Customer {
	@graphql.field()
	id: string;

	@mgoose.prop({ required: true })
	@graphql.field({ required: true })
	firstname: string;

	@mgoose.prop({ required: true })
	@graphql.field({ required: true })
	lastname: string;

	@mgoose.prop()
	@graphql.field()
	age: number;

	@mgoose.prop()
	@graphql.field()
	weight: number;

	@mgoose.prop({ type: [CustomerPhone] })
	@graphql.field({ type: [CustomerPhone] })
	phones: CustomerPhone[];

	@mgoose.prop({ type: Schema.Types.ObjectId })
	@graphql.field()
	accountId: number;

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

	@mgoose.method()
	static getSomething() {}

	@mgoose.method()
	getPrototypeSomething() {}
}

export class CustomerQuery extends Customer {
	@graphql.field({ type: [Customer] })
	and: [Customer];
}
