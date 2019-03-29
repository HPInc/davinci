import _ from 'lodash';
import * as errors from './errors';
import { rest } from './rest';
import { context } from './context';

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

	@rest.get({ path: '/', summary: 'List' })
	find(@rest.param({ name: 'query', in: 'query' }) query, @context() context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const { limit, skip, sort, select, populate, where } = this.parseQuery(query);
		const mQuery = this.model.find(where, select, { limit, skip, sort, context });

		if (populate) {
			return mQuery.populate(populate);
		}

		return mQuery;
	}

	async findOne(@rest.param({ name: 'query', in: 'query' }) query, @context() context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const { sort, select, populate, where } = this.parseQuery(query);
		let mQuery = this.model.findOne(where, select, { sort, context });

		if (populate) {
			mQuery = mQuery.populate(populate);
		}

		const result = await mQuery;
		if (!result) {
			throw new errors.NotFound();
		}

		return result;
	}

	@rest.get({ path: '/:id', summary: 'Fetch by id' })
	async findById(
		@rest.param({
			name: 'id',
			in: 'path'
		})
		id,
		@rest.param({ name: 'query', in: 'query' }) query,
		@context() context
	) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');

		return this.findOne({ ...query, _id: id }, { context });
	}

	@rest.post({ path: '/', summary: 'Create' })
	async create(@rest.param({ name: 'data', in: 'body' }) data, @context() context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const [record] = await this.model.create([data], { context });

		return record;
	}

	@rest.patch({ path: '/:id', summary: 'Update' })
	async updateById(
		@rest.param({
			name: 'id',
			in: 'path'
		})
		id,
		@rest.param({ name: 'data', in: 'body' }) data,
		@context() context
	) {
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

	@rest.del({ path: '/:id', summary: 'Delete' })
	async deleteById(@rest.param({ name: 'id', in: 'path' }) id: string, @context() context) {
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
