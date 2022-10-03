import _ from 'lodash';
import bluebird from 'bluebird';
import * as errors from '../../src/errors/httpErrors';
import { route } from '../../src/index';
import { context } from '../../src/express';

interface IParsedMongooseFilters {
	limit?: number;
	skip?: number;
	sort?: string | object;
	select?: string | [string];
	populate?: object | [object];
	where: object;
}

/**
 * The controllers that will extend this class
 * will include out of the box those standard CRUD routes
 * GET /api/{resourceName}
 * GET /api/{resourceName}/{id}
 * PATCH /api/{resourceName}/{id}
 * POST /api/{resourceName}
 * DELETE /api/{resourceName}/{id}
 */
export default class MongooseController {
	maxLimit: number;
	defaultQueryParams: { $limit: number; $skip: number };

	constructor(protected model?) {
		this.maxLimit = 1000;
		this.defaultQueryParams = {
			$limit: 10,
			$skip: 0
		};
	}

	@route.get({ path: '/', summary: 'List' })
	public async find(@route.param({ name: 'query', in: 'query' }) query, @context() davinciContext) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const { limit, skip, sort, select, populate, where } = this.parseQuery(query, davinciContext);
		const mQuery = this.model.find(where, select, { limit, skip, sort, davinciContext });

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

	public async findOne(@route.param({ name: 'query', in: 'query' }) query, @context() davinciContext) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const { sort, select, populate, where } = this.parseQuery(query);
		const mQuery = this.model.findOne(where, select, { sort, davinciContext });
		if (populate) {
			mQuery.populate(populate);
		}

		const result = await mQuery;
		if (!result) {
			throw new errors.NotFound();
		}

		return result;
	}

	@route.get({ path: '/:id', summary: 'Fetch by id' })
	public async findById(
		@route.param({
			name: 'id',
			in: 'path'
		})
		id: string,
		@route.param({ name: 'query', in: 'query' }) query,
		@context() davinciContext
	) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');

		return this.findOne({ ...query, _id: id }, { davinciContext });
	}

	@route.post({ path: '/', summary: 'Create' })
	public async create(@route.param({ name: 'data', in: 'body' }) data, @context() davinciContext) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const [record] = await this.model.create([data], { davinciContext });

		return record;
	}

	@route.patch({ path: '/:id', summary: 'Update' })
	public async updateById(
		@route.param({
			name: 'id',
			in: 'path'
		})
		id: string,
		@route.param({ name: 'data', in: 'body' }) data,
		@context() davinciContext
	) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const updated = await this.model.findOneAndUpdate({ _id: id }, data, {
			new: true,
			runValidators: true,
			setDefaultsOnInsert: true,
			davinciContext
		});

		if (!updated) {
			throw new errors.NotFound();
		}

		return updated;
	}

	@route.del({ path: '/:id', summary: 'Delete' })
	public async deleteById(@route.param({ name: 'id', in: 'path' }) id: string, @context() davinciContext) {
		if (!this.model) throw new errors.MethodNotAllowed('No model implemented');
		const removed = await this.model.findOneAndDelete({ _id: id }, { davinciContext });

		if (!removed) {
			throw new errors.NotFound();
		}

		return removed;
	}

	/**
	 * Function to convert from `feathers` query format to mongoose
	 * { $limit, $skip, $populate, $sort, $select, (where |...rest) } =>
	 * { limit, skip, populate, sort, select, where }
	 * @param qry
	 * @param davinciContext
	 */
	protected parseQuery(qry, davinciContext?: any): IParsedMongooseFilters {
		const query = _.merge({}, this.defaultQueryParams, qry);

		return _.reduce(
			query,
			(acc, value: any, key: string) => {
				const k = key.substr(1);
				if (key === '$limit') {
					const val = Math.min(Number(value), this.maxLimit);
					return { ...acc, [k]: val };
				}

				if (key === '$skip') {
					return { ...acc, [k]: Number(value) };
				}

				if (key === '$sort') {
					return { ...acc, [k]: value };
				}

				if (key === '$populate' && value) {
					const parsedPopulates = this.parsePopulate(value, davinciContext);

					return { ...acc, [k]: parsedPopulates };
				}

				if (key === '$select' && value) {
					return { ...acc, [k]: (value || []).join(' ') };
				}

				if (key === '$where' && value) {
					const where = acc.where || {};
					return { ...acc, [k]: { ...where, ...value } };
				}

				return { ...acc, where: { ...acc.where, [key]: value } };
			},
			{ where: {}, select: null }
		);
	}

	/**
	 * Normalise $populate query parameter
	 * @param populateQuery
	 * @param davinciContext
	 *
	 * @return mongoose populate
	 */
	protected parsePopulate(populateQuery, davinciContext) {
		const populates = Array.isArray(populateQuery) ? populateQuery : [populateQuery];

		return populates.reduce((acc, pop) => {
			const populateArgs: any = {};
			let query = {};
			if (typeof pop === 'string') {
				populateArgs.path = pop;
			} else if (typeof pop === 'object') {
				query = _.pick(pop, ['$limit', '$skip', '$sort', '$select', '$populate', '$where']);
				populateArgs.path = pop.path;
			}
			const { limit, skip, sort, select, populate, where } = this.parseQuery(query, davinciContext);

			acc.push(
				_.merge(populateArgs, {
					match: where,
					populate,
					select,
					options: { limit, skip, sort, davinciContext }
				})
			);

			return acc;
		}, []);
	}
}
