const _ = require('lodash');
const errors = require('feathers-errors');
const createQueryFilters = require('feathers-query-filters');

class BaseController {
	get({ id }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		return this.model.get(id, context);
	}

	list({ query = {} }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const parsedFilter = createQueryFilters(query);

		return this.model.find({
			query: _.assign({}, parsedFilter.query, parsedFilter.filters)
		}, context);
	}

	create({ data }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		return this.model.create(data, context);
	}

	update({ id, data }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		return this.model.update(id, data, context);
	}

	patch({ id, data }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		return this.model.patch(id, data, context);
	}

	remove({ id }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		return this.model.remove(id, context);
	}
}

module.exports = BaseController;
