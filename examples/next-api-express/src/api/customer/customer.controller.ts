import { route } from '@davinci/http-server';
import { context, interceptor } from '@davinci/core';
import { Context } from '../../types';
import { Customer } from './customer.schema';

@route.controller({
	basePath: '/api/customers'
})
export default class CustomerController {
	@interceptor<Context>((next, { handlerArgs, context }) => {
		console.log(handlerArgs, context);
		return next();
	})
	@route.get({ path: '/hello', summary: 'That is a hello method' })
	hello(@route.query() firstname: string, @route.query() age: number, @context() ctx: Context) {
		return { success: true, firstname, age, ctx };
	}

	@route.post({ path: '/' })
	create(@route.body() data: Customer) {
		return { success: true, data };
	}
}
