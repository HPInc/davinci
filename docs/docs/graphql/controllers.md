# GraphQL Controllers

A Controller defines the shape of the GraphQL `queries` and `mutations`.
Each decorated method in the controller acts as a resolver.

## Implements GraphQL controller methods

A controller method is a decorated class method that takes parameter and return a result.

The `@grapqhl.[query|mutation]()` decorators mark a class method as a query or mutation resolver.

A resolver can accept arguments, that can be defined using the `@graphql.arg()` decorator.
The type of each argument will be inferred and inspected, and validated against the value provided.\
You can even supply complex types, like schema classes.
Please note that due to a limitation on the typescript reflection mechanism, there are cases
where you need to pass the type explicitly.

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
