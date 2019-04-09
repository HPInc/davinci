import BaseController from '../../../src/BaseController';
import model from './customer.model';
import CustomerSchema from './customer.schema';
import { context, express, route } from '../../../src';

const { get, controller, query } = route;

@controller({ basepath: '/api/customer', excludedMethods: ['deleteById'] })
export default class CustomerController extends BaseController {
	constructor() {
		super(model, CustomerSchema);
	}

	@get({ path: '/', summary: 'List' })
	find(@query('query') query: string, @context() context): CustomerSchema {
		return super.find(query, context);
	}

	@get({ path: '/hello', summary: 'That is a hello method' })
	hello(
		@query('firstname') firstname: string,
		@query('age') age: number,
		@query({
			name: 'customerObj',
			required: true
		})
		customerObj: object
	) {
		console.log(firstname, age);
		return customerObj;
	}

	@get({ path: '/customresponse', summary: 'That is a custom response method' })
	customResponse(@express.res() res) {
		res.json({ test: 1 });
	}

	@express.middleware((req, res, next) => {
		console.log(req, res);
		next();
	})
	pathWithCustomMiddleware() {}
}
