# @davinci/mongoose

DaVinci, per se is database agnostic and doesn't have an opinion on how your API persists the data.

However, it provides a set of utilities that allow you to use `MongoDB` in conjunction with it.

More specifically, it provides:

-   Functions to generate Mongoose models starting from a decorated typescript class.
-   Functions to register some `write/read` hooks.

## Installation

```sh
npm i --save @davinci/mongoose
```

or

```sh
yarn add @davinci/mongoose
```

## Define the Schema

The schema is, once again, defined using decorators applied to methods of a class.
It means that the same schema can be reused for different things,
for example as mongoose and openapi schemas.

```typescript
import { Schema } from 'mongoose';
import { mgoose } from '@davinci/mongoose';

class CustomerPhone {
	@mgoose.prop()
	number: string;

	@mgoose.prop()
	isPrimary: boolean;
}

// we can define compound indexes using the index decorator
// alternatively, they can be specified at the field level
@mgoose.index({ firstname: 1, lastname: 1 }, { unique: true })
export default class Customer {
	@mgoose.prop({ required: true })
	firstname: string;

	@mgoose.prop({ required: true })
	lastname: string;

	@mgoose.prop({ enum: ['member', 'admin'] })
	role: string;

	@mgoose.prop({ type: [CustomerPhone] })
	phones: CustomerPhone[];

	@mgoose.prop({ type: Schema.Types.ObjectId })
	@mgoose.populate({
		name: 'account',
		opts: { ref: 'Account', foreignField: '_id', justOne: true }
	})
	accountId: string;
}
```

## Create the Model

Using the `generateModel` function of the `@davinci/mongoose` package,
we can generate a Mongoose Model by passing as argument the schema defined above.

```typescript
import { mgoose } from '@davinci/mongoose';
import CustomerSchema from './CustomerSchema';

const { generateModel } = mgoose;

const Customer = generateModel<CustomerSchema>(CustomerSchema, 'customer', 'customers');

export default Customer;
```

## Hooks

@davinci/mongoose provides six different hooks: `beforeRead`, `afterRead`,
`beforeWrite`, `afterWrite`, `beforeDelete` and `afterDelete`.\
Under the hood, they use [Mongoose Middlewares](https://mongoosejs.com/docs/middleware.html)

-   **beforeRead / afterRead**\
    It gets triggered before/after executing any find/fetch operation.
    Under the hood it register the following Mongoose Middlewares:
    `find`,
    `findOne`,
    `findOneAndDelete`,
    `findOneAndRemove`,
    `findOneAndUpdate`,
    `deleteMany`,
    `update`,
    `updateOne`,
    `updateMany`
-   **beforeWrite / afterWrite**\
    It gets triggered before/after executing any save/persist operation.
    Under the hood it register the following Mongoose Middlewares:
    `findOneAndUpdate`,
    `save`,
    `update`,
    `updateMany`
-   **beforeDelete / afterDelete**\
    It gets triggered before/after executing any delete operation.
    Under the hood it register the following Mongoose Middlewares:
    `deleteMany`,
    `findOneAndDelete`,
    `findOneAndRemove`

```typescript
import { Document, model } from 'mongoose';
import { mgoose } from '@davinci/mongoose';
import { httpErrors } from '@davinci/core';
import CustomerSchema from './CustomerSchema';
import { afterDelete } from './hooks';

const { generateSchema, beforeRead, beforeWrite, afterDelete } = mgoose;

const schema = generateSchema(CustomerSchema);

beforeRead<Context>(schema, ({ query, context }) => {
	// inject accountId before persisting into DB
	if (!context) return;

	const currentQuery = query.getQuery();
	query.setQuery({ ...currentQuery, accountId: context.accountId });
});

beforeWrite<Context, CustomerSchema>(schema, ({ query, doc, context }) => {
	// inject accountId before persisting into DB
	if (!context) return;

	// required check for atomic operations
	if (doc) {
		doc.accountId = context.accountId;
	} else {
		// @ts-ignore
		query.setUpdate({
			...query.getUpdate(),
			accountId: context.accountId
		});
	}
});

afterDelete<Context>(schema, ({ doc }) => {
	if (doc) {
		// perform some cleanup
	}
});

const Customer = model<CustomerSchema & Document>('Customer', schema, 'customers');

export default Customer;
```
