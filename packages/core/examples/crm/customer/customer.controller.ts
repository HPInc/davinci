import BaseController from '../../../src/BaseController';
import model from './customer.model';
import CustomerSchema from './customer.schema';
import { context, express, route } from '../../../src';

const { get, controller, query } = route;

@controller({ basepath: '/api/customer', resourceSchema: CustomerSchema, excludedMethods: ['deleteById'] })
@express.middleware.before((_req, _res, next) => {
	console.log('controller before middleware');
	next();
})
export default class CustomerController extends BaseController {
	constructor() {
		super(model);
	}

	@get({ path: '/', summary: 'List' })
	find(@query('query') query: string, @context() context) {
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

	@get({ path: '/customResponse', summary: 'That is a custom response method' })
	customResponse(@express.res() res) {
		res.json({ test: 1 });
	}

	@get({ path: '/customMiddlewares', summary: 'This is a method with custom middlewares' })
	@express.middleware.before((req, res, next) => {
		console.log(req, res);
		next();
	})
	@express.middleware.after((req, res, next) => {
		console.log(req, res);
		next();
	})
	pathWithCustomMiddleware() {
		return { result: 1 };
	}

	@get({ path: '/customHeader', summary: 'This is a method with custom header' })
	@express.header('Content-Type', 'text/plan')
	customHeader() {
		return { result: 1 };
	}
}
