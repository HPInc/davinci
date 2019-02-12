module.exports = {
	definitions: {
		'Search Results': {
			properties: {
				name: {
					type: 'string'
				}
			}
		}
	},
	paths: {
		'/': {
			get: {
				summary: 'Perform Search',
				operationId: 'search',
				parameters: [
					{
						name: 'searchTerm',
						in: 'query',
						description: 'The search term',
						required: true
					}
				],
				responses: {
					200: {
						schema: {
							$ref: '#/definitions/Search Results'
						}
					}
				}
			}
		}
	}
};
