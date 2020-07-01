import { express, route } from '@davinci/core';

const { post, controller, body } = route;

@controller({
	basepath: '/api/customers'
})
@express.middleware.before((_req, _res, next) => {
	console.log('controller before middleware');
	next();
})
export default class CustomerController {
	@post({ path: '/hello', summary: 'That is a hello method' })
	hello(@body({ type: [String] }) firstnames: string[]) {
		console.log(firstnames);
		return firstnames;
	}
}
