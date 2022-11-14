# Getting Started

## Installation

```sh
npm i --save @davinci/graphql
```

or

```sh
yarn add @davinci/graphql
```

<br/>

## Start shaping the GraphQL API

Implement query, mutations and its resolvers declaratively, using classes and decorators.

### Create a controller

```typescript
// file: ./AuthorController.ts
import { graphql } from '@davinci/graphql';
import { context } from '@davinci/core';
import model from './AuthorModel';
import AuthorSchema, { AuthorQuery } from './AuthorSchema';
import { BookSchema } from '../book';

const { query, parent, mutation, fieldResolver, arg } = graphql;

export default class AuthorController {
	model = model;

	@query(AuthorSchema, 'authorById')
	getAuthorById(@arg({ required: true }) id: string) {
		return this.model.findById(id);
	}

	@query([AuthorSchema], 'authors')
	findAuthors(@arg() query: AuthorQuery, @context() context: any) {
		return this.model.find(query, {}, { context });
	}

	@mutation(AuthorSchema)
	createAuthor(@arg({ required: true }) data: AuthorSchema) {
		return this.model.create(data);
	}

	@mutation(AuthorSchema)
	updateAuthorById(@arg({ required: true }) id: string, @arg({ required: true }) data: AuthorSchema) {
		return this.model.findByIdAndUpdate(id, data, { new: true });
	}

	@fieldResolver<BookSchema>(BookSchema, 'authors', [AuthorSchema])
	getBookAuthors(@parent() book: BookSchema, @arg() query: AuthorQuery, @context() context: any) {
		console.log(query);
		// @ts-ignore
		return this.findAuthors({ ...query, _id: { $in: book.authorIds } }, context);
	}
}
```

### Create the main file

```typescript
// file: ./index.ts
import express, { Express } from 'express';
import { createApp, DaVinciExpress } from '@davinci/core';
import { createGraphQLServer } from '@davinci/graphql';
import { BookController, AuthorController } from './api';

const options = {
	boot: {
		dirPath: './build/examples/crm/boot'
	},
	healthChecks: {
		readynessEndpoint: '/.ah/ready',
		livenessEndpoint: '/.ah/live'
	}
};

const expressApp: Express = express();

createApp(expressApp, options, app => {
	createGraphQLServer(app, [BookController, AuthorController]);
});

if (require.main === module) {
	// this module was run directly from the command line as in node xxx.js
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
