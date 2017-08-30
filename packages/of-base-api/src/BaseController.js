const _ = require('lodash');
const Promise = require('bluebird');
const Errors = require('./errors');
const Utils = require('./utils');

class BaseController {
	constructor(model, options = {}) {
		this.model = model;
		this.options = options;
	}

	buildQuery(req, criteria) {
		// use the context filter, if one was defined
		const context = this.options.contextFilter ? this.options.contextFilter(req) : {};
		// include any custom criteria defined on this request
		return _.assign(context, criteria);
	}

	list(req, res, next) {
		const page = req.query.page || 1;
		const pagesize = Math.min(100, Math.max(1, req.query.pagesize || 10));
		if (page <= 0) {
			next(new Errors.InvalidPage(page));
			return Promise.resolve();
		}
		const where = this.buildQuery(req, req.criteria);
		const params = {
			where,
			page,
			pagesize,
			sort: req.query.sort,
			q: req.query.q
		};
		return this.model.$search(params);
	}

	show(req, res, next) {
		const id = req.params.id || req.params._id;
		if (/^[0-9a-fA-F]{24}$/.test(id) === false) {
			next(new Errors.InvalidId());
			return Promise.resolve();
		}
		const query = this.buildQuery(req, { _id: id });
		return this.model.findOne(query).then(Utils.throwIfNotFound);
	}

	create(req) {
		const modelData = _.extend(req.body);
		if (modelData._id) delete modelData._id;
		return this.model.create(modelData);
	}

	update(req) {
		const id = req.params.id || req.params._id;
		let modelData = _.extend(req.body);
		if (modelData._id) delete modelData._id;

		const query = this.buildQuery(req, { _id: id });

		if (this.options.updateFilter) {
			modelData = this.options.updateFilter(modelData);
		}

		return this.model
			.findOneAndUpdate(query, { $set: modelData }, { new: true, runValidators: true })
			.then(Utils.throwIfNotFound);
	}

	destroy(req) {
		const id = req.params.id || req.params._id;
		const query = this.buildQuery(req, { _id: id });
		return this.model
			.findOne(query)
			.then(Utils.throwIfNotFound)
			.then(result => {
				// result.remove() triggers mongoose hooks,
				// whereas this.model.remove(result) doesn't
				return result.remove();
			});
	}

	destroyMultiple(req) {
		const ids = req.body;
		if (!Array.isArray(ids)) {
			throw new Errors.BadRequest('body must be an array of IDs');
		}

		if (ids.length > 50) {
			throw new Errors.BadRequest('request exceeded maximum of 50 in a batch');
		}

		const query = this.buildQuery(req, { _id: { $in: ids } });

		// result.remove() triggers mongoose hooks,
		// whereas Model.remove(result) doesn't
		this.model.find(query).exec()
			.each(result => result.remove());
	}
}

module.exports = BaseController;
