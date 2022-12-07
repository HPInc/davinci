# Interceptors

Interceptors are functions that can be injected within the modules' handling of a particular request or event.  
Some examples of where the interceptors may be useful are:

-   execute logic before / after method execution (e.g. monitoring)
-   transform the result (or exception) returned- (or thrown) from a method
-   prevent the execution of a method (e.g. data restriction, guards)
-   override a method execution (e.g., for caching purposes)

In DaVinci, interceptors are framework-agnostic, and aim to replace specific framework implementations, like Express middlewares or Fastify hooks.

## How to use

The following example describe how to implement an interceptor in an HTTP server module.

The interceptors can be registered both at the controller and at the method level.

```ts
import { route, httpErrors } from '@davinci/http-server';
import { context, interceptor } from '@davinci/core';
import { Context } from '../../types';
import { Customer } from './customer.schema';

// simple logging
@interceptor<{ Context: Context }>((next, bag) => {
	const { handlerArgs, context, state, module, request, response } = bag;
	console.log(handlerArgs, context, state, module, request, response);
	return next();
})
@route.controller({
	basePath: '/api/customers'
})
export default class CustomerController {
	// prevent access based on arbitrary condition
	@interceptor<{ Context: Context }>((next, bag) => {
		const { context } = bag;
		if (context.hasPermissionsToWrite) {
			throw new httpErrors.Forbidden();
		}

		return next();
	})
	@route.post({ path: '/' })
	create(@route.body({ required: true }) data: Customer) {
		return { success: true, data };
	}
}
```
