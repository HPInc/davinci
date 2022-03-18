import { context } from '@davinci/core';
import { route } from '@davinci/http';
import { createMongooseController } from '@davinci/mongoose';
import model from './customer.model';
import CustomerSchema from './customer.schema';

const { get, controller, query } = route;

@controller({
	basepath: '/api/customers'
})
export default class CustomerController extends createMongooseController(model, CustomerSchema) {
	@get({ path: '/hello', summary: 'That is a hello method' })
	hello(@query() firstname: string, @query() age: number, @context() context) {
		console.log(firstname, age, context);
		return firstname;
	}
}
