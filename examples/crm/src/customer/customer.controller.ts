import { context, express, route } from '@davinci/core';
import { createMongooseController } from '@davinci/mongoose';
import model from './customer.model';
import CustomerSchema from './customer.schema';

const { get, controller, query } = route;

@controller({
	basepath: '/api/customer',
	excludedMethods: ['create', 'findById']
})
@express.middleware.before((_req, _res, next) => {
	console.log('controller before middleware');
	next();
})
export default class CustomerController extends createMongooseController(model, CustomerSchema) {
	@get({ path: '/hello', summary: 'That is a hello method' })
	hello(@query('firstname') firstname: string, @query('age') age: number, @context() context) {
		console.log(firstname, age, context);
		return firstname;
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
