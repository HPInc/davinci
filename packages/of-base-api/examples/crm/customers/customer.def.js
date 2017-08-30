module.exports = {
	definitions: {
		Customer: {
			properties: {
				"id": {
					"type": "string",
					"id": true,
					"required": true
				},
				"firstName": {
					"type": "string"
				},
				"lastName": {
					"type": "string"
				},
				"ssn": {
					"type": "string"
				},
				"customerSince": {
					"type": "date"
				},
				"street": {
					"type": "string"
				},
				"state": {
					"type": "string"
				},
				"city": {
					"type": "string"
				},
				"zip": {
					"type": "string"
				},
				"lastUpdated": {
					"type": "date"
				}
			}
		},
		'Customer List': {
			properties: {
				count: {
					type: "number"
				},
				items: {
					type: "object",
					$ref: "#/definitions/Customer"
				}
			}
		}
	},
	paths: {
		'/': {
			get: {
				operationId: 'list',
				parameters: [
					{
						name: 'id',
						in: 'query',
						description: 'The customer id.',
						required: true,
						type: 'string',
						format: 'JSON'
					},
					{
						name: 'filter',
						in: 'query',
						description: 'The criteria used to narrow down the number of customers returned.',
						required: false,
						type: 'string',
						format: 'JSON'
					}
				],
				responses: {
					200: {
						description: 'List of Customers',
						schema: {
							$ref: '#/definitions/Customer List'
						}
					}
				}
			}
		},
		'/custom': {
			get: {
				operationId: 'myMethod',
				responses: {
					200: {
						description: 'Access to a custom controller method',
						schema: {
							$ref: '#/definitions/Customer'
						}
					}
				}
			}
		}
	}
};
