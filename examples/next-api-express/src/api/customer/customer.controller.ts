import { route } from '@davinci/http-server';

const { get, controller, query } = route;

@controller({
	basePath: '/api/customers'
})
export default class CustomerController {
	@get({ path: '/hello', summary: 'That is a hello method' })
	hello(@query() firstname: string, @query() age: number) {
		console.log(firstname, age);
		return { success: true, firstname };
	}
}
