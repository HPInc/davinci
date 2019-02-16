import _ from 'lodash';
import * as errors from './errors';
import { get, post, patch, del, param } from './rest/swagger';

interface IParsedMongooseFilters {
	limit?: number;
	skip?: number;
	sort?: string | object;
	select?: string | [string];
	populate?: object | [object];
	where: object;
}

export default class BaseController {
	model: any;
	schema: Function;
	constructor(model?, schema?) {
		this.model = model;
		this.schema = schema;
	}

	@get({ path: '/', summary: 'List' })
	find(@param({ name: 'query', in: 'query' }) query, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const { limit, skip, sort, select, populate, where } = this.parseQuery(query);
		const mQuery = this.model.find(where, select, { limit, skip, sort, context });

		if (populate) {
			return mQuery.populate(populate);
		}

		return mQuery;
	}

	async findOne(@param({ name: 'query', in: 'query' }) query, context) {
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

	@get({ path: '/:id', summary: 'Fetch by id' })
	async findById(@param({ name: 'id', in: 'path' }) id, @param({ name: 'query', in: 'query' }) query, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');

		return this.findOne({ ...query, _id: id }, context);
	}

	@post({ path: '/', summary: 'Create' })
	async create(@param({ name: 'data', in: 'body' }) data, context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const [record] = await this.model.create([data], { context });

		return record;
	}

	@patch({ path: '/:id', summary: 'Update' })
	async updateById(@param({ name: 'id', in: 'path' }) id, @param({ name: 'data', in: 'body' }) data, context) {
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

	@del({ path: '/:id', summary: 'Delete' })
	async removeById(@param({ name: 'id', in: 'path' }) id: string, context) {
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
