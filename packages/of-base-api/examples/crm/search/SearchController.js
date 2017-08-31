const BaseController = require('../../../src/BaseController');
const definition = require('./search.def');

class SearchController extends BaseController {
	constructor({ def = definition } = {}) {
		super();
		this.def = def;
	}

	async search({ searchTerm }) {
		// perform the search function here
		console.log(`searching for '${searchTerm}'...`);

		const searchResults = [1, 2, 3, 4];
		return searchResults;
	}
}

module.exports = SearchController;
