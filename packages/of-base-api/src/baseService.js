const _ = require('lodash');

const baseService = {
	async findOne(query, params = {}) {
		const defaultQuery = { filters: { $limit: 1 } };
		const q = _.defaultsDeep({}, defaultQuery, query);
		params.skipHooks = true;
		const results = await this.find(q, params);

		if (Array.isArray(results)) return results.shift();
		return results.data.shift();
	}
};

module.exports = baseService;
