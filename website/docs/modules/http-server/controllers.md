# Controllers

A Controller is a class that implements methods that will handle incoming requests.
It implements an application’s business logic and acts as a bridge between the HTTP/REST API and domain/database models.

## Implements controller methods

A controller method is a decorated class method that takes parameter and return a result.
As you may notice, all the logic that deal with low-level `request` and `response` constructs, is abstracted away.

A class is marked as controller using the `@route.controller()` decorator.

The `@route.[get|post|patch|put|del|head]()` decorators mark a class method as a route handler.

A route handler can accept arguments, that can be defined using the `@route.[path|query|body]()` decorators.
The type of each argument will be inferred and inspected, and validated against the value provided.  
You can even supply complex types, like schema classes.
Please note that due to a limitation on the typescript reflection mechanism, there are cases
where you need to pass the type explicitly.

```ts
import { route } from '@davinci/http-server';

@route.controller({ basePath: '/api/customers' })
export class CustomerController {
	@route.get({ path: '/', summary: 'This is a find method' })
	findCustomer(@route.query() firstname: string) {
		return firstname;
	}

	@route.post({ path: '/create', summary: 'This is a create method' })
	createCustomer(@route.body() data: object) {
		return { success: true, data };
	}
}
```

## Advanced cases 

There are some cases where you may want to have more control on how the incoming request
will be handled.  
In those cases, you can inject the Low level `Req` and `Res` objects as arguments   
using the `@route.[request|response]()`
decorators.

```ts
import { route } from '@davinci/http-server';
import type { FastifyRequest, FastifyResponse } from 'fastify';

@route.controller({ basePath: '/api/customers' })
export class CustomerController {
	@route.get({ path: '/custom-response', summary: 'This method will redirect' })
	customResponse(@route.request() req: FastifyRequest, @route.response() res: FastifyResponse) {
		const redirectUrl = req.hostname === 'myHostname' ? '/redirect-url-1' : '/redirect-url-2';

		return res.redirect(redirectUrl);
	}
}
```
