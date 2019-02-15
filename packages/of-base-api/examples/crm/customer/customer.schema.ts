import { prop as mongooseProp } from '../../../src/lib/mongoose.helpers';
import { prop as swaggerProp, definition } from '../../../src/rest/swagger/decorators/prop';

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
	@mongooseProp()
	@swaggerProp()
	number: string;
	@mongooseProp()
	isPrimary: boolean;
}

@definition({ title: 'Customer' })
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
}
