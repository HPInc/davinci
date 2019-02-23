import { mongooseProp, swaggerProp, swaggerDefinition } from '../../../src';

export interface ICustomer {
	firstname: string;
	lastname: string;
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
	@swaggerProp()
	number: string;
	@mongooseProp()
	isPrimary: boolean;
}

@swaggerDefinition({ title: 'Customer' })
export default class Customer implements ICustomer {
	@mongooseProp()
	@swaggerProp()
	firstname: string;

	@mongooseProp()
	@swaggerProp()
	lastname: string;

	@mongooseProp()
	@swaggerProp()
	weight: number;

	@mongooseProp({ type: [CustomerPhone] })
	@swaggerProp({ type: [CustomerPhone] })
	phones: CustomerPhone[];

	@mongooseProp()
	@swaggerProp()
	accountId: number;

	@mongooseProp({ type: Date })
	@swaggerProp({ type: Date })
	startDate: string;
}
