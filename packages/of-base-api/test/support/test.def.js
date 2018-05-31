module.exports = {
	definitions: {
		Customer: {
			type: 'object',
			properties: {
				firstname: {
					type: 'string'
				},
				lastname: {
					type: 'string'
				},
				weight: {
					type: 'integer'
				}
			},
			required: ['firstname', 'lastname']
		},
		'Customer List': {
			properties: {
				count: {
					type: 'number'
				},
				items: {
					type: 'object',
					$ref: '#/definitions/Customer'
				}
			}
		}
	},
	// is this actually used? it is not part of the openAPI spec
	parameters: [
		{
			name: 'data',
			in: 'body',
			description: 'The new customer data',
			required: true,
			schema: {
				$ref: '#/definitions/Customer'
			}
		}
	],
	paths: {
		'/': {
			post: {
				summary: 'Create Customer',
				description: 'This endpoint allows the user to create a customer.',
				operationId: 'create',
				parameters: [
					{
						name: 'data',
						in: 'body',
						description: 'The new customer data',
						required: true,
						schema: {
							$ref: '#/definitions/Customer'
						}
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
			},
			get: {
				summary: 'List Customers',
				description: 'This endpoint allows the user to list all customers.',
				operationId: 'list',
				parameters: [
					{
						name: 'query',
						in: 'query',
						description: 'The criteria used to narrow down the number of customers returned.',
						required: false,
						type: 'object'
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
				summary: 'My Custom Method',
				description: 'This endpoint does something custom.',
				operationId: 'customMethod',
				responses: {
					200: {
						description: 'Access to a custom controller method',
						schema: {
							$ref: '#/definitions/Customer'
						}
					}
				}
			}
		},
		'/{id}': {
			get: {
				summary: 'Get Customer',
				operationId: 'getById',
				parameters: [
					{
						name: 'id',
						in: 'path',
						description: 'The customer id.',
						required: true,
						type: 'object'
					}
				],
				responses: {
					200: {
						schema: {
							$ref: '#/definitions/Customer List'
						}
					}
				}
			},
			put: {
				summary: 'update Customer',
				operationId: 'update',
				parameters: [
					{
						name: 'id',
						in: 'path',
						description: 'The customer id.',
						required: true,
						type: 'object'
					},
					{
						name: 'data',
						in: 'body',
						description: 'The customer data.',
						required: true,
						type: 'object'
					}
				],
				responses: {
					200: {
						schema: {
							$ref: '#/definitions/Customer List'
						}
					}
				}
			}
		}
	}
};
