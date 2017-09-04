const _ = require('lodash');
const errors = require('feathers-errors');
const createQueryFilters = require('feathers-query-filters');

class BaseController {
	getById({ id }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		return this.model.findOne({
			query: { [this.model.id]: id }
		}, context);
	}

	list({ query = {} }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const parsedFilter = createQueryFilters(query);

		return this.model.find({
			query: _.assign({}, parsedFilter.query, parsedFilter.filters),
			paginate: {
				default: 10,
				max: 1000
			}
		}, context);
	}

	create({ data }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		return this.model.create(data, context);
	}

	update({ id, data }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		context.query = { [this.model.id]: id };
		return this.model.patch(null, data, context);
	}

	remove({ id }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		context.query = { [this.model.id]: id };
		return this.model.remove(null, context);
	}
}

module.exports = BaseController;
