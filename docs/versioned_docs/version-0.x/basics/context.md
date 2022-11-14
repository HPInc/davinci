# Context

## What is Context?

Context is a variable defined by you that may contain request-related data.
Its lifecycle is the same as the request being handled, it gets destroyed once the request is terminated.

## Define context

The context factory function is a parameter of the `createRouter` function.
It accepts `req` and `res` Express objects.

```typescript
import express, { Express } from 'express';
import { createApp, createRouter, DaVinciExpress, Dav } from '@davinci/core';
import CustomerController from './customer/customer.controller';

const expressApp: Express = express();

interface Context {
	accountId: string;
}

function createContext({ req }: { req: Request }): Context {
	return {
		accountId: req.headers['x-custom-accountid']
	};
}

createApp(expressApp, app => {
	app.use(createRouter({ Controller: CustomerController, resourceName: 'Customer', contextFactory: createContext }));
});

if (require.main === module) {
	// this module was run directly from the command line as in node xxx.js
	(expressApp as DaVinciExpress).start();
}

export default expressApp;
```
