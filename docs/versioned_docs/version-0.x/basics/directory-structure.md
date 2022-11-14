# Directory Structure

DaVinci doesn't require a particular directory structure.\
However the following structure may be considered scalable and
to be following the best practices.

```
.
├── src
│   ├── boot //(optional)
│   ├── api
│   │   ├── customer
│   │   │   └── index.ts // (main entry for the resource. It should export the modules needed externally)
│   │   │   └── CustomerController.ts // (define endpoints and handlers for the 'customer' resource)
│   │   │   └── CustomerSchema.ts // (it may contain schemas for the database layer as well as schemas for payloads and parameters used by the controller)
│   │   │   └── CustomerModel.ts // (it may contain the logic to create the model, using the above schema (ex: mongoose))
│   │   ├── [...]
│   ├── lib // (it may contain shared libraries or logic)
│   ├── index.ts // (it contain the logic to read the controllers and start the server)
│
└── package.json
└── [...]
```
