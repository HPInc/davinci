import BaseController from '../../../src/BaseController';
import model from './customer.model';
import CustomerSchema from './customer.schema';
import { rest, context, express } from '../../../src';

@rest.controller({ basepath: '/api/customer', excludedMethods: ['deleteById'] })
export default class CustomerController extends BaseController {
	constructor() {
		super(model, CustomerSchema);
	}

	@rest.get({ path: '/', summary: 'List' })
	find(@rest.param({ name: 'query', in: 'query' }) query: string, @context() context): CustomerSchema {
		return super.find(query, context);
	}

	@rest.get({ path: '/hello', summary: 'That is a hello method' })
	hello(
		@rest.param({ name: 'firstname', in: 'query' }) firstname: string,
		@rest.param({
			name: 'customerObj',
			in: 'query',
			required: true,
			schema: {
				// type: 'number',
				$ref: 'Customer'
			}
		})
		customerObj
	) {
		console.log(firstname);
		return customerObj;
	}

	@rest.get({ path: '/customresponse', summary: 'That is a custom response method' })
	customResponse(@express.res() res) {
		res.json({ test: 1 });
	}

	@express.middleware((req, res, next) => {
		console.log(req, res);
		next();
	})
	pathWithCustomMiddleware() {}
}
