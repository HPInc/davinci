# Controllers

A Controller is a class that implements methods that will handle incoming requests.
It implements an application’s business logic and acts as a bridge between the HTTP/REST API and domain/database models.

## Implements controller methods

A controller method is a decorated class method that takes parameter and return a result.
As you may notice, all the logic that deal with `request` and `response` express objects is abstracted away.

A class is marked as controller using the `@route.controller()` decorator.

The `@route.[get|post|patch|put|del|head]()` decorators mark a class method as a route handler.

A route handler can accept arguments, that can be defined using the `@route.[path|query|body]()` decorators.
The type of each argument will be inferred and inspected, and validated against the value provided.\
You can even supply complex types, like schema classes.  
Please note that due to a limitation on the typescript reflection mechanism, there are cases
where you need to pass the type explicitly.

```typescript
import { route } from '@davinci/core';

const { controller, get, query, post, body } = route;

@controller({ basepath: '/api/customers' })
export class CustomerController {
	@get({ path: '/hello', summary: 'That is a hello method' })
	findCustomer(@query() firstname: string) {
		return firstname;
	}

	@post({ path: '/create', summary: 'That is a create method' })
	create(@body() data: object) {
		return { success: true, data };
	}
}
```

## Advanced cases (AKA: use express primitives)

There are some cases where you may want to have more control on how the incoming request
will be handled.\
In those cases, you can inject the Express `Req` and `Res` objects as arguments \
using the `@express.[req|res]()`
decorators.

```typescript
import { route, express } from '@davinci/core';
import { Request, Response } from 'express';

@route.controller({ basepath: '/api/customers' })
export class CustomerController {
	@route.get({ path: '/custom-response', summary: 'This method will redirect' })
	customResponse(@express.req() req: Request, @express.res() res: Response) {
		const redirectUrl = req.hostname === 'myHostname' ? '/redirect-url-1' : '/redirect-url-2';

		return res.redirect(redirectUrl);
	}
}
```
