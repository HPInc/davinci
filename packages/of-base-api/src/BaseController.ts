import _ from 'lodash';
import bluebird from 'bluebird';
import * as errors from './errors';
import { route } from './route';
import { context } from './context';

type ParsedMongooseFilters = {
	limit?: number;
	skip?: number;
	sort?: string | object;
	select?: string | [string];
	populate?: object | [object];
	where: object;
};

export default class BaseController {
	model: any;
	schema: Function;
	additionalSchemas: Function;
	maxLimit: number;
	defaultQuery: { $limit: number; $skip: number };
	constructor(model?, schema?, additionalSchemas?) {
		this.model = model;
		this.schema = schema;
		this.additionalSchemas = additionalSchemas;
		this.maxLimit = 1000;
		this.defaultQuery = {
			$limit: 10,
			$skip: 0
		};
	}

	@route.get({ path: '/', summary: 'List' })
	async find(@route.param({ name: 'query', in: 'query' }) query, @context() context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const { limit, skip, sort, select, populate, where } = this.parseQuery(query);
		const mQuery = this.model.find(where, select, { limit, skip, sort, context });

		const [data, total] = await bluebird.all([
			populate ? mQuery.populate(populate) : mQuery,
			this.model.count(where)
		]);

		return {
			data,
			limit,
			skip,
			total
		};
	}

	async findOne(@route.param({ name: 'query', in: 'query' }) query, @context() context) {
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

	@route.get({ path: '/:id', summary: 'Fetch by id' })
	async findById(
		@route.param({
			name: 'id',
			in: 'path'
		})
		id,
		@route.param({ name: 'query', in: 'query' }) query,
		@context() context
	) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');

		return this.findOne({ ...query, _id: id }, { context });
	}

	@route.post({ path: '/', summary: 'Create' })
	async create(@route.param({ name: 'data', in: 'body' }) data, @context() context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const [record] = await this.model.create([data], { context });

		return record;
	}

	@route.patch({ path: '/:id', summary: 'Update' })
	async updateById(
		@route.param({
			name: 'id',
			in: 'path'
		})
		id,
		@route.param({ name: 'data', in: 'body' }) data,
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

	@route.del({ path: '/:id', summary: 'Delete' })
	async deleteById(@route.param({ name: 'id', in: 'path' }) id: string, @context() context) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const removed = await this.model.findOneAndDelete({ _id: id }, { context });

		if (!removed) {
			throw new errors.NotFound();
		}

		return removed;
	}

	parseQuery(qry): ParsedMongooseFilters {
		const query = _.merge({}, this.defaultQuery, qry);

		return _.reduce(
			query,
			(acc, value: any, key: string) => {
				if (key === '$limit') {
					const k = key.substr(1);
					const val = Math.min(Number(value), this.maxLimit);
					return { ...acc, [k]: val };
				}

				if (key === '$skip') {
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
