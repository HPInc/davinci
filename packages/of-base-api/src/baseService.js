const _ = require('lodash');

const baseService = {
	async findOne(query, params = {}) {
		const defaultQuery = { filters: { $limit: 1 } };
		const q = _.defaultsDeep({}, defaultQuery, query);
		params.skipHooks = true;
		const { data } = await this.find(q, params);
		return data[0];
	}
};

module.exports = baseService;
