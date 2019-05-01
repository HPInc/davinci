import { ObjectId } from 'mongodb';
import { mgoose, swagger } from '../../../src';

class CustomerPhone {
	@mgoose.prop()
	@swagger.prop()
	number: string;
	@mgoose.prop()
	isPrimary: boolean;
}

class BirthType {
	@mgoose.prop()
	@swagger.prop()
	city: string;
}

@mgoose.index({ firstname: 1, lastname: 1 })
@swagger.definition({ title: 'Customer' })
export default class Customer {
	@mgoose.prop()
	@swagger.prop()
	firstname: string;

	@mgoose.prop()
	@swagger.prop()
	lastname: string;

	@mgoose.prop()
	@swagger.prop()
	age: number;

	@mgoose.prop()
	@swagger.prop()
	weight: number;

	@mgoose.prop({ type: [CustomerPhone] })
	@swagger.prop({ type: [CustomerPhone] })
	phones: CustomerPhone[];

	@mgoose.prop({ type: ObjectId })
	@swagger.prop()
	accountId: number;

	@mgoose.prop({ type: Date })
	@swagger.prop({ type: Date })
	startDate: string;

	@mgoose.prop()
	@swagger.prop()
	birth: BirthType;

	@mgoose.prop({ type: ObjectId })
	@mgoose.populate({ name: 'file', opts: { ref: 'File', foreignField: '_id', justOne: true } })
	@swagger.prop()
	fileId: string;

	@mgoose.method()
	static getSomething() {}

	@mgoose.method()
	getPrototypeSomething() {}
}
