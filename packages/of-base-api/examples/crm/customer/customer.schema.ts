import { mongooseProp, swagger } from '../../../src';

export interface ICustomer {
	firstname: string;
	lastname: string;
	age: number;
	weight: number;
	accountId: number;
	startDate: string;
}

export interface ICustomerPhone {
	number: string;
	isPrimary: boolean;
}

class CustomerPhone implements ICustomerPhone {
	@mongooseProp()
	@swagger.prop()
	number: string;
	@mongooseProp()
	isPrimary: boolean;
}

@swagger.definition({ title: 'Customer' })
export default class Customer implements ICustomer {
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
}
