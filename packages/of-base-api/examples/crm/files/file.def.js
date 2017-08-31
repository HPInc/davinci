module.exports = {
	definitions: {
		File: {
			properties: {
				_id: {
					type: 'string',
					id: true,
					required: true
				},
				name: {
					type: 'string'
				},
				contextId: {
					type: 'string'
				}
			}
		},
		'File List': {
			properties: {
				total: {
					type: 'number'
				},
				items: {
					type: 'object',
					$ref: '#/definitions/File'
				}
			}
		}
	},
	paths: {
		'/': {
			get: {
				operationId: 'list',
				responses: {
					200: {
						schema: {
							$ref: '#/definitions/File List'
						}
					}
				}
			}
		},
		'/{id}': {
			get: {
				operationId: 'get',
				parameters: [
					{
						name: 'id',
						in: 'path',
						description: 'The file id.',
						required: true,
						type: 'string',
						format: 'JSON'
					}
				],
				responses: {
					200: {
						schema: {
							$ref: '#/definitions/File List'
						}
					}
				}
			}
		},
		'/custom': {
			get: {
				operationId: 'customFn',
				responses: {
					200: {
						schema: {
							$ref: '#/definitions/File List'
						}
					}
				}
			}
		}
	}
};
