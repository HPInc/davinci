import BaseController from '../../../src/BaseController';
import CustomerModel from './customer.model';
import CustomerSchema from './customer.schema';
import { controller, get, param } from '../../../src/rest';
import { ICustomer } from './customer.schema';

@controller({ basepath: '/customer' })
export default class CustomerController extends BaseController {
	// easy to test
	constructor({ model = CustomerModel } = {}) {
		super(model, CustomerSchema);
		// this.fileModel = FileModel.create();
	}

	@get({ path: '/', summary: 'List' })
	find(@param({ name: 'query', in: 'query' }) query: string, context): ICustomer {
		return super.find(query, context);
	}

	customMethod() {
		// return this.fileModel.find({});
	}
}
