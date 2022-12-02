# Getting Started

## Installation

DaVinci can be installed with either `npm` or `yarn`.

```bash
npm i --save @davinci/http-server-fastify @davinci/http-server ajv ajv-formats fastify @fastify/cors @fastify/static qs
```

<br/>

## Install HTTP Server module

In this example, we are going to implement a basic HTTP Server, defining with API endpoints and handlers declaratively, using classes and decorators.

### Create a controller

```typescript
// file: ./CustomerController.ts
import { context } from '@davinci/core';
import { route } from '@davinci/http-server';

@route.controller({ basepath: '/api/customers' })
export class CustomerController {
	@route.get({ path: '/hello', summary: 'This is a hello method' })
	hello(@route.query() firstname: string, @context() context) {
		console.log(firstname, context);
		return firstname;
	}

	@route.post({ path: '/create', summary: 'This is a create method' })
	create(@route.body() data: object) {
		console.log(data);
		return { success: true };
	}
}
```

### Create the main file

```typescript
// file: ./index.ts
import { createApp } from '@davinci/core';
import { FastifyHttpServer } from '@davinci/http-server-fastify';
import { CustomerController } from './customer.controller.ts';

const app = createApp();

app.registerController(CustomerController).registerModule(new FastifyHttpServer());

if (require.main === module) {
	app.init();
}

export default app;
```

<br/>

### Start the app

In your terminal, run:

```
ts-node ./index.ts
```

The app is now serving requests at [http://localhost:3000](http://localhost:3000)
