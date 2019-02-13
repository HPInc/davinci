import { prop } from '../../../src/lib/mongoose.helpers';

export interface ICustomer {
	firstname: string;
	lastname: string;
	weight: number;
}

export interface ICustomerPhone {
	number: string;
	isPrimary: boolean;
}

class CustomerPhone implements ICustomerPhone {
	@prop()
	number: string;
	@prop()
	isPrimary: boolean;
}

export default class Customer implements ICustomer {
	@prop()
	firstname: string;

	@prop()
	lastname: string;

	@prop()
	weight: number;

	@prop({ type: [CustomerPhone] })
	phones: CustomerPhone[];
}
