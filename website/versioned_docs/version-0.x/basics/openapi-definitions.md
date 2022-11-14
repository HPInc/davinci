# OpenAPI Definitions

## Add schemas

#### Create a Customer schema

Let's write the schema for the customer

```typescript
// file: ./CustomerSchema.ts
import { openapi } from '@davinci/core';

class CustomerPhone {
	@openapi.prop()
	number: string;

	@openapi.prop()
	isPrimary: boolean;
}

@openapi.definition({ title: 'BirthType' })
class BirthType {
	@openapi.prop()
	city: string;
}

@openapi.definition({ title: 'Customer' })
export class Customer {
	@openapi.prop({ required: true })
	firstname: string;

	@openapi.prop({ required: true })
	lastname: string;

	// IMPORTANT: arrays must be annotated using explicit type
	@openapi.prop({ type: [CustomerPhone] })
	phones: CustomerPhone[];

	@openapi.prop()
	birth: BirthType;
}
```

<br/>

### Add it to the controller method

Now, we can use it as schema for the payload `create` method on our controller.

```typescript{6}
// file: ./CustomerController.ts
import { CustomerSchema } from './CustomerSchema';

export class CustomerController {
	// ...
	@route.post({ path: '/create', summary: 'This is a create method' })
	create(@route.body() data: CustomerSchema) {
		console.log(data);
		return { success: true };
	}
	// ...
}
```

The incoming payload of the API request will be validated using [Ajv](https://github.com/epoberezkin/ajv)
against the supplied CustomerSchema schema

The resulting openapi schema will be:

```json
{
	"paths": {
		"/api/customers": {
			"post": {
				"summary": "This is a create method",
				"operationId": "create",
				"parameters": [
					{
						"in": "body",
						"name": "data",
						"schema": { "$ref": "#/definitions/Customer" }
					}
				],
				"responses": { "200": { "schema": { "$ref": "#/definitions/Customer" } } },
				"consumes": ["application/json"],
				"produces": ["application/json"],
				"tags": ["Customer"]
			}
		}
	},
	"definitions": {
		"Customer": {
			"title": "Customer",
			"type": "object",
			"properties": {
				"firstname": { "type": "string" },
				"lastname": { "type": "string" },
				"phones": {
					"type": "array",
					"items": {
						"type": "object",
						"title": "phones",
						"properties": { "number": { "type": "string" }, "isPrimary": { "type": "boolean" } }
					}
				},
				"accountId": { "type": "number" },
				"birth": {
					"$ref": "#/definitions/BirthType"
				}
			},
			"required": ["firstname", "lastname"]
		},
		"BirthType": {
			"title": "BirthType",
			"type": "object",
			"properties": {
				"city": {
					"type": "string"
				}
			}
		}
	}
}
```

You may have noticed that a `BirthType` definition is created, because the BirthType class has
been decorated with `@openapi.definition()`, as opposed to `CustomerPhone` that will be defined inline.
