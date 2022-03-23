# Getting Started

## Installation

DaVinci can be installed with either `npm` or `yarn`.

```sh
npm i --save @davinci/core
```

or

```sh
yarn add @davinci/core
```


<br/>

## Start shaping the API
Implement API endpoints and handlers declaratively, using classes and decorators.

### Create a controller

```typescript
// file: ./CustomerController.ts
import { context, route } from '@davinci/core';

@route.controller({ basepath: '/api/customers' })
export class CustomerController {
	@route.get({ path: '/hello', summary: 'That is a hello method' })
	hello(@route.query() firstname: string, @context() context) {
		console.log(firstname, context);
		return firstname;
	}

	@route.post({ path: '/create', summary: 'That is a create method' })
	create(@route.body() data: object) {
		console.log(data);
		return { success: true };
	}
}
```

### Create the main file

```typescript
// file: ./index.ts
import express, { Express } from 'express';
import { createApp, createRouter, DaVinciExpress } from '@davinci/core';
import { CustomerController } from './CustomerController';
import packageJson = require('../package.json');

const options = {
	version: packageJson.version,
	openapi: {
		docs: {
			path: '/api-doc.json'
		},
		ui: {
			path: '/explorer'
		}
	}
};

const expressApp: Express = express();

createApp(expressApp, options, app => {
	app.use(createRouter({ Controller: CustomerController }));	
});

if (require.main === module) {
	// this module was run directly from the command line, so we can start the server
	(expressApp as DaVinciExpress).start();
}

export default expressApp;
```

<br/>

### Start the app

In your terminal, run:

```
ts-node ./index.ts
```

The app is now serving requests at [http://localhost:3000](http://localhost:3000)

Additionally, a swagger UI is served at [http://localhost:3000/explorer](http://localhost:3000/explorer)
