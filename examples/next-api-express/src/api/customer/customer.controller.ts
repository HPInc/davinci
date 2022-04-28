import { route } from '@davinci/http-server';
import { interceptor } from '@davinci/core';

const { get, controller, query } = route;

@controller({
	basePath: '/api/customers'
})
export default class CustomerController {
	@interceptor((next, bag) => {
		console.log(bag.handlerArgs);
		return next();
	})
	@get({ path: '/hello', summary: 'That is a hello method' })
	hello(@query() firstname: string, @query() age: number) {
		console.log(firstname, age);
		return { success: true, firstname, age };
	}
}
