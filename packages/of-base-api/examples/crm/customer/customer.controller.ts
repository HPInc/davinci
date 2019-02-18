import BaseController from '../../../src/BaseController';
import model from './customer.model';
import CustomerSchema from './customer.schema';
import { controller, get, param } from '../../../src/rest';

@controller({ basepath: '/customers', excludedMethods: ['deleteById'] })
export default class CustomerController extends BaseController {
	constructor() {
		super(model, CustomerSchema);
	}

	@get({ path: '/', summary: 'List' })
	find(@param({ name: 'query', in: 'query' }) query: string, context): CustomerSchema {
		return super.find(query, context);
	}

	@get({ path: '/hello', summary: 'That is a hello method' })
	hello(@param({ name: 'firstname', in: 'query' }) firstname): string {
		return firstname;
	}
}
