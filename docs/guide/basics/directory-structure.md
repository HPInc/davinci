# Directory Structure

::: vue
.
├── src
│   ├── boot _(optional)_
│   ├── api
│   │   ├── `customer`
│   │   │   └── CustomerController.ts _`(define endpoints and handlers for the 'customer' resource)`_
│   │   │   └── CustomerSchema.ts _`(it may contain schemas for the database layer as well as schemas for payloads and parameters used by the controller)`_
│   │   │   └── CustomerModel.ts _`(it may contain the logic to instantiate the model, using the above schema (ex: mongoose))`_
│   │   ├── `[...]`
│   ├── lib _`(it may contain shared libraries or logic)`_
│   ├── index.ts _`(it contain the logic to read the controllers and start the server)`_
│ 
└── package.json
:::
