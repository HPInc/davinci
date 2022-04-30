import { route } from '@davinci/http-server';
import { context, interceptor } from '@davinci/core';
import { Context } from '../../types';

const { get, controller, query } = route;

@controller({
	basePath: '/api/customers'
})
export default class CustomerController {
	@interceptor<Context>((next, { handlerArgs, context }) => {
		console.log(handlerArgs, context);
		return next();
	})
	@get({ path: '/hello', summary: 'That is a hello method' })
	hello(@query() firstname: string, @query() age: number, @context() ctx: Context) {
		return { success: true, firstname, age, ctx };
	}
}
