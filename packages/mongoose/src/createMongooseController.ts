/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

// eslint-disable-next-line max-classes-per-file
import _ from 'lodash';
import bluebird from 'bluebird';
import config from './config';

export interface Constructor<T> {
	new (...args: any[]): T;
}

interface IParsedMongooseFilters {
	limit?: number;
	skip?: number;
	sort?: object;
	select?: string | [string];
	populate?: object | [object];
	where: object;
}

export interface IMongooseController {
	maxLimit: number;
	defaultQueryParams: { $limit: number; $skip: number };
	find(query: object, context: object): Promise<any>;
	findOne(query: object, context: object): Promise<any>;
	findById(id: string, query: object, context: object): Promise<any>;
	create(data: any, context: object): Promise<any>;
	updateById(id: string, data: any, context: object): Promise<any>;
}

/**
 * We use a factory to pass Model and ResourceSchema.
 * This allow us to use ResourceSchema to define some request types, and build the openaapi specification
 * correctly
 *
 * will include out of the box those standard CRUD routes
 * GET /api/{resourceName}
 * GET /api/{resourceName}/{id}
 * PATCH /api/{resourceName}/{id}
 * POST /api/{resourceName}
 * DELETE /api/{resourceName}/{id}
 */
export const createMongooseController = <T extends Constructor<{}>>(
	Model,
	ResourceSchema
): Constructor<IMongooseController> & T => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
	const { context, route, httpErrors, openapi, express } = require('@davinci/core');

	@openapi.definition({ title: `${Model.modelName}PopulateQueryParameter` })
	class PopulateQueryParameter {
		@openapi.prop({ required: true })
		path: string;

		@openapi.prop()
		$limit?: number;

		@openapi.prop()
		$skip?: number;

		@openapi.prop()
		$where?: object;

		@openapi.prop({
			oneOf: [
				{
					type: 'object'
				},
				{
					type: 'array',
					items: { type: 'string' }
				}
			]
		})
		$select?: object | string[];

		@openapi.prop()
		$sort?: object;

		@openapi.prop({
			type: null,
			oneOf: [
				{ $ref: `${Model.modelName}PopulateQueryParameter` },
				{
					type: 'array',
					items: { $ref: `${Model.modelName}PopulateQueryParameter` }
				}
			]
		})
		$populate?: PopulateQueryParameter | PopulateQueryParameter[];
	}

	@openapi.definition({ title: `${Model.modelName}QueryParameters` })
	class QueryParameters {
		@openapi.prop({
			type: null,
			oneOf: [
				{ $ref: `${Model.modelName}PopulateQueryParameter` },
				{
					type: 'array',
					items: { $ref: `${Model.modelName}PopulateQueryParameter` }
				}
			]
		})
		$populate?: PopulateQueryParameter | PopulateQueryParameter[];

		@openapi.prop()
		$limit?: number;

		@openapi.prop()
		$skip?: number;

		@openapi.prop()
		$where?: object;

		@openapi.prop({
			type: null,
			oneOf: [
				{
					type: 'object'
				},
				{
					type: 'array',
					items: { type: 'string' }
				}
			]
		})
		$select?: object | string[];

		@openapi.prop()
		$sort?: object;
	}

	// Let's create a usable resource schema
	class RSchema extends ResourceSchema {}

	// This is the response type of a find request
	@openapi.definition({ title: `${Model.modelName}ListResponse` })
	class ListResponseSchema {
		@openapi.prop({ type: [RSchema] })
		data: RSchema[];

		@openapi.prop()
		total: number;

		@openapi.prop()
		skip: number;

		@openapi.prop()
		limit: number;
	}

	@express.middleware.after((err, _req, _res, next) => {
		if (err.name === 'ValidationError') {
			const { name, message, errors: ers, stack } = err;
			const validationError = new httpErrors.HttpError(name, message, 400, null, ers);
			validationError.stack = stack;
			return next(validationError);
		}

		return next(err);
	})
	@route.controller({ additionalSchemas: [PopulateQueryParameter] })
	class MongooseController implements IMongooseController {
		maxLimit: number;

		defaultQueryParams: { $limit: number; $skip: number };

		constructor(protected model = Model) {
			this.maxLimit = 1000;
			this.defaultQueryParams = {
				$limit: 10,
				$skip: 0
			};
		}

		@route.get({ path: '/', summary: 'List', responses: { 200: ListResponseSchema } })
		public async find(@route.query() query: QueryParameters, @context() ctx) {
			if (!this.model) throw new httpErrors.MethodNotAllowed('No model implemented');
			const { limit, skip, sort, select, populate, where } = this.parseQuery(query, ctx);
			const mQuery = this.model.find(where, select, { limit, skip, sort, context: ctx });

			const [data, total] = await bluebird.all([
				populate ? mQuery.populate(populate) : mQuery,
				(_.isEmpty(where) && config.ALLOW_ESTIMATED_DOCUMENT_COUNT) ?
					this.model.estimatedDocumentCount().setOptions({ context: ctx })
					: this.model.countDocuments(where).setOptions({ context: ctx })
			]);

			return {
				data,
				limit,
				skip,
				total
			};
		}

		public async findOne(@route.query() query, @context() ctx) {
			if (!this.model) throw new httpErrors.MethodNotAllowed('No model implemented');
			const { sort, select, populate, where } = this.parseQuery(query);
			const mQuery = this.model.findOne(where, select, { sort, context: ctx });
			if (populate) {
				mQuery.populate(populate);
			}

			const result = await mQuery;
			if (!result) {
				throw new httpErrors.NotFound('Record not found');
			}

			return result;
		}

		@route.get({ path: '/{id}', summary: 'Fetch by id', responses: { 200: RSchema } })
		public async findById(
			@route.path() id: string,
			@route.param({ name: 'query', in: 'query' }) query: QueryParameters,
			@context() ctx
		) {
			if (!this.model) throw new httpErrors.MethodNotAllowed('No model implemented');

			return this.findOne({ ...query, _id: id }, ctx);
		}

		@route.post({ path: '/', summary: 'Create', responses: { 200: RSchema } })
		public async create(@route.body() data: RSchema, @context() ctx) {
			if (!this.model) throw new httpErrors.MethodNotAllowed('No model implemented');
			const [record] = await this.model.create([data], { context: ctx });

			return record;
		}

		@route.patch({
			path: '/{id}',
			summary: 'Update',
			responses: { 200: RSchema },
			validation: { partial: true }
		})
		public async updateById(@route.path() id: string, @route.body() data: RSchema, @context() ctx) {
			if (!this.model) throw new httpErrors.MethodNotAllowed('No model implemented');
			const updated = await this.model.findOneAndUpdate({ _id: id }, data, {
				new: true,
				runValidators: true,
				setDefaultsOnInsert: true,
				context: ctx
			});

			if (!updated) {
				throw new httpErrors.NotFound();
			}

			return updated;
		}

		@route.del({ path: '/{id}', summary: 'Delete', responses: { 200: RSchema } })
		public async deleteById(@route.path() id: string, @context() ctx) {
			if (!this.model) throw new httpErrors.MethodNotAllowed('No model implemented');
			const removed = await this.model.findOneAndDelete({ _id: id }, { context: ctx });

			if (!removed) {
				throw new httpErrors.NotFound();
			}

			return removed;
		}

		/**
		 * Function to convert from `feathers` query format to mongoose
		 * { $limit, $skip, $populate, $sort, $select, (where |...rest) } =>
		 * { limit, skip, populate, sort, select, where }
		 * @param qry
		 * @param context
		 */
		protected parseQuery(qry, ctx?: any): IParsedMongooseFilters {
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
						const parsedPopulates = this.parsePopulate(value, ctx);

						return { ...acc, [k]: parsedPopulates };
					}

					if (key === '$select' && value) {
						const v = Array.isArray(value) ? value : Object.keys(value);
						return { ...acc, [k]: (v || []).join(' ') };
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
		 * @param context
		 *
		 * @return mongoose populate
		 */
		protected parsePopulate(populateQuery, ctx) {
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
				const { limit, skip, sort, select, populate, where } = this.parseQuery(query, ctx);

				acc.push(
					_.merge(populateArgs, {
						match: where,
						populate,
						select,
						options: { limit, skip, sort, context: ctx }
					})
				);

				return acc;
			}, []);
		}
	}

	return (MongooseController as unknown) as Constructor<IMongooseController> & T;
};
