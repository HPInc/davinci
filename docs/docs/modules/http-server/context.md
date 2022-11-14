# Context

## What is Context?

Context is a variable defined by you that may contain request-related data.
Its lifecycle is the same as the request being handled, it gets destroyed once the request is terminated.

## Define context

The context factory function can be specified using the `setContextFactory` method in the FastifyHttpServer or ExpressHttpServer modules.  
It accepts `request` and `response` objects.

```ts
import { createApp } from '@davinci/core';
import { FastifyHttpServer } from '@davinci/http-server-fastify';
import { CustomerController } from './api/customer';

const app = createApp();
const contextFactory = ({ request }) => ({ accountId: request.headers['x-accountid'] });

interface Context {
	accountId: string;
}

app.registerController(CustomerController).registerModule(
	new FastifyHttpServer().setContextFactory(contextFactory)
);

if (require.main === module) {
	app.init();
}

export default app;

```

## Access context

You can access the value of the context by using the context decorator


```ts
import { route, context } from '@davinci/http-server';

@route.controller({ basePath: '/api/customers' })
export class CustomerController {
	@route.get({ path: '/', summary: 'This is a hello method' })
	findCustomer(@context() ctx) {
		return ctx;
	}
}
```

