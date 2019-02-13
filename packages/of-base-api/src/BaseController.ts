import _ from 'lodash';
const errors = require('./errors');
// const createQueryFilters = require('feathers-query-filters');

interface IParsedMongooseFilters {
	limit?: number;
	skip?: number;
	sort?: string | object;
	select?: string | [string];
	populate?: object | [object];
	where: any;
}

export default class BaseController {
	def: any;
	model: any;
	constructor(def?, model?) {
		this.def = def;
		this.model = model;
	}

	find({ query = {} }: any = {}, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const { limit, skip, sort, select, populate, where } = this.parseQuery(query);
		const mQuery = this.model.find(where, select, { limit, skip, sort, context });

		if (populate) {
			return mQuery.populate(populate);
		}

		return mQuery;
	}

	async findOne({ query = {} }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const { sort, select, populate, where } = this.parseQuery(query);
		let mQuery = this.model.find(where, select, { limit: 1, sort, context });

		if (populate) {
			mQuery = mQuery.populate(populate);
		}

		const result = await mQuery;
		if (!result.length) {
			throw new errors.NotFound();
		}

		return result[0];
	}

	async findById({ id, query = {} }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');

		return this.findOne({ query: { ...query, _id: id } }, context);
	}

	async create({ data }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const [record] = await this.model.create([data], { context });

		return record;
	}

	async updateById({ id, data }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const updated = await this.model.findOneAndUpdate({ _id: id }, data, {
			new: true,
			runValidators: true,
			setDefaultsOnInsert: true,
			context
		});

		if (!updated) {
			throw new errors.NotFound();
		}

		return updated;
	}

	async removeById({ id }, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const removed = await this.model.findOneAndDelete({ _id: id }, { context });

		if (!removed) {
			throw new errors.NotFound();
		}

		return removed;
	}

	parseQuery(query): IParsedMongooseFilters {
		return _.reduce(
			query,
			(acc, value: any, key: string) => {
				if (['$limit', '$skip'].includes(key)) {
					const k = key.substr(1);
					return { ...acc, [k]: Number(value) };
				}

				if (['$sort', '$populate'].includes(key)) {
					const k = key.substr(1);
					return { ...acc, [k]: value };
				}

				if (key === '$select' && value) {
					const k = key.substr(1);
					return { ...acc, [k]: (value || []).join(' ') };
				}

				return { ...acc, where: { ...acc.where, [key]: value } };
			},
			{ where: {}, select: null }
		);
	}
}
