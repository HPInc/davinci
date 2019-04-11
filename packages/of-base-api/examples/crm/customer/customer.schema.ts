import { mongooseProp, mongooseIndex, swagger } from '../../../src';

class CustomerPhone {
	@mongooseProp()
	@swagger.prop()
	number: string;
	@mongooseProp()
	isPrimary: boolean;
}

class BirthType {
	@mongooseProp()
	@swagger.prop()
	city: string;
}

@mongooseIndex({ firstname: 1, lastname: 1 })
@swagger.definition({ title: 'Customer' })
export default class Customer {
	@mongooseProp()
	@swagger.prop()
	firstname: string;

	@mongooseProp()
	@swagger.prop()
	lastname: string;

	@mongooseProp()
	@swagger.prop()
	age: number;

	@mongooseProp()
	@swagger.prop()
	weight: number;

	@mongooseProp({ type: [CustomerPhone] })
	@swagger.prop({ type: [CustomerPhone] })
	phones: CustomerPhone[];

	@mongooseProp()
	@swagger.prop()
	accountId: number;

	@mongooseProp({ type: Date })
	@swagger.prop({ type: Date })
	startDate: string;

	@mongooseProp()
	@swagger.prop()
	birth: BirthType;
}
