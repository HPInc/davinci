# Validation

The HttpServer module includes support for validating requests using [Ajv](https://ajv.js.org/guide/why-ajv.html).

## Enabling Validation

To enable validation, you just have to pass a `validationFactory` to the HttpServer options like this:

```ts
new ExpressHttpServer({
	contextFactory,
	validationFactory: createAjvValidator({
		ajvOptions: {
			header: { coerceTypes: true },
			query: { coerceTypes: true }
		},
		plugins: [[addErrors as any]]
	})
})
```

## Customising Validation

You have the possibility to use a default validator by calling `createAjvValidator()` empty.

Otherwise, you can fully customize each instance of the `AjvValidator`, which has one instance of Ajv for each of the following request elements: header, query, body, path.

### Customise Options

You can pass an Ajv Options object like the following to apply the same options to all the Ajv instances:

```ts
new FastifyHttpServer({
	contextFactory,
	validationFactory: createAjvValidator({
		ajvOptions: { strict: true, coerceTypes: false }
	})
})
```

Or you can specify the Ajv Options individually for each of the sources: 

```ts
new ExpressHttpServer({
	contextFactory,
	validationFactory: createAjvValidator({
		ajvOptions: {
			header: { coerceTypes: true },
			query: { coerceTypes: true }
		}
	})
})
```

**Note** that in this case, if you don't pass specific options for a given source, the default options will be used for that source's instance.

### Customise Plugins

Similarly to the Ajv Options, Ajv Plugins can be also added to all or to some of the sources.

The following example will apply the plugin with the given options to the Ajv instances for all the sources:

```ts
new FastifyHttpServer({
	contextFactory,
	validationFactory: createAjvValidator({
		// Array of tuples where the first element of the tuple is the plugin
		// and the second is the options for the plugin (if needed)
		plugins: [[addErrors, { singleError: true }]]
	})
})
```

Or you can apply the plugins only to some instances:

```ts
new FastifyHttpServer({
	contextFactory,
	validationFactory: createAjvValidator({
		plugins: {
			body: [[somePlugin]],
			query: [[somePlugin], [someOtherPlugin]]
		}
	})
})
```

**Note** that `addFormats` Ajv plugin is always added by default to all the Ajv instances. trying to add this plugin again will cause an error.