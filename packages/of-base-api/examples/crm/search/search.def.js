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
				operationId: 'search',
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
