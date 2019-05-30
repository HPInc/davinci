import { Schema } from 'mongoose';
import { mgoose } from '@substrate/mongoose';
import { openapi } from '@substrate/core';

class CustomerPhone {
	@mgoose.prop()
	@openapi.prop()
	number: string;
	@mgoose.prop()
	isPrimary: boolean;
}

class BirthType {
	@mgoose.prop()
	@openapi.prop()
	city: string;
}

@mgoose.index({ firstname: 1, lastname: 1 })
@openapi.definition({ title: 'Customer' })
export default class Customer {
	@mgoose.prop()
	@openapi.prop()
	firstname: string;

	@mgoose.prop()
	@openapi.prop()
	lastname: string;

	@mgoose.prop()
	@openapi.prop()
	age: number;

	@mgoose.prop()
	@openapi.prop()
	weight: number;

	@mgoose.prop({ type: [CustomerPhone] })
	@openapi.prop({ type: [CustomerPhone] })
	phones: CustomerPhone[];

	@mgoose.prop({ type: Schema.Types.ObjectId })
	@openapi.prop()
	accountId: number;

	@mgoose.prop({ type: Date })
	@openapi.prop({ type: Date })
	startDate: string;

	@mgoose.prop()
	@openapi.prop()
	birth: BirthType;

	@mgoose.prop({ type: Schema.Types.ObjectId })
	@mgoose.populate({ name: 'file', opts: { ref: 'File', foreignField: '_id', justOne: true } })
	@openapi.prop()
	fileId: string;

	@mgoose.method()
	static getSomething() {}

	@mgoose.method()
	getPrototypeSomething() {}
}
