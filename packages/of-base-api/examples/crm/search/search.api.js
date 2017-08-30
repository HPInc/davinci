const API = require('../../../src/API');
const def = require('./search.def');

class SearchAPI extends API {
	async search(context) {
		// perform the search function here
		const searchResults = [1, 2, 3, 4];
		return searchResults;
	}
}

const controller = new SearchAPI('search', def);

controller.contextFilter = context => ({ contextId: context.contextId });

module.exports = controller;
