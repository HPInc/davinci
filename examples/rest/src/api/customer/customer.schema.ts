import { Schema } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import { openapi } from '@davinci/core';

class CustomerPhone {
	@mgoose.prop()
	@openapi.prop()
	number: string;

	@mgoose.prop()
	@openapi.prop()
	isPrimary: boolean;
}

@openapi.definition({ title: 'BirthType' })
class BirthType {
	@mgoose.prop()
	@openapi.prop()
	city: string;

	@mgoose.prop()
	@openapi.prop()
	date: Date;
}

@mgoose.index({ firstname: 1, lastname: 1 }, { unique: true })
@openapi.definition({ title: 'Customer' })
export default class Customer {
	@mgoose.prop({ required: true })
	@openapi.prop({ required: true })
	firstname: string;

	@mgoose.prop({ required: true })
	@openapi.prop({ required: true })
	lastname: string;

	@mgoose.prop()
	@openapi.prop({
		minimum: 18
	})
	age: number;

	@mgoose.prop()
	@openapi.prop({
		type: null,
		oneOf: [
			{
				type: 'number'
			},
			{
				type: 'string',
				pattern: '\\d+(kg|lbs)'
			}
		]
	})
	weight: number | string;

	// typeFactory is useful in cases where schemas depends on each other (circular dependencies),
	// because they will be evaluated lazily
	@mgoose.prop({ typeFactory: () => [CustomerPhone] })
	@openapi.prop({ typeFactory: () => [CustomerPhone] })
	phones: CustomerPhone[];

	@mgoose.prop({ type: Schema.Types.ObjectId })
	@openapi.prop()
	accountId: string;

	@mgoose.prop()
	@openapi.prop()
	birth: BirthType;

	@mgoose.prop({ type: Schema.Types.ObjectId })
	// @mgoose.populate({ name: 'file', opts: { ref: 'File', foreignField: '_id', justOne: true } })
	@openapi.prop()
	fileId: string;

	@mgoose.method()
	static getSomething() {}

	@mgoose.method()
	getPrototypeSomething() {}
}
