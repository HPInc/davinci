import { graphql, queryHelpers } from '@davinci/graphql';
import { context } from '@davinci/core';
import Bluebird from 'bluebird';
import model from './author.model';
import AuthorSchema, { AuthorFilter, AuthorPagination } from './author.schema';
import { BookSchema } from '../index';

const { query, parent, mutation, fieldResolver, arg, selectionSet, middleware } = graphql;

@middleware(async (_source, _args, _three) => {
	await Bluebird.delay(2000);
	console.log('3');
})
@middleware(async (_source, _args, _two) => {
	await Bluebird.delay(2000);
	console.log('2');
})
@middleware(async (_source, _args, _one) => {
	await Bluebird.delay(2000);
	console.log('1');
})
export default class AuthorController {
	model = model;

	@query(AuthorSchema, 'authorById')
	getAuthorById(@arg({ required: true }) id: string) {
		return this.model.findById(id);
	}

	@middleware(async (_source, _args, _four) => {
		await Bluebird.delay(2000);
		console.log('4');
	})
	@query([AuthorSchema], 'authors')
	findAuthors(
		@arg() where: AuthorFilter,
		@arg() paginate: AuthorPagination,
		@selectionSet() selection,
		@context() context: any
	) {
		const q = queryHelpers.toMongodbQuery(where);
		const { $limit, $skip } = queryHelpers.toMongodbQuery(paginate || {});
		const projection = queryHelpers.toMongdbProjection(selection || []);

		return this.model
			.find(q, projection, { context })
			.limit($limit)
			.skip($skip);
	}

	@mutation(AuthorSchema)
	createAuthor(@arg({ required: true }) data: AuthorSchema) {
		return this.model.create(data);
	}

	@mutation(AuthorSchema)
	updateAuthorById(@arg({ required: true }) id: string, @arg({ required: true, partial: true }) data: AuthorSchema) {
		return this.model.findByIdAndUpdate(id, data, { new: true });
	}

	@mutation(AuthorSchema)
	updateAuthor(@arg() where: AuthorFilter, @arg({ required: true, partial: true }) data: AuthorSchema) {
		const query = queryHelpers.toMongodbQuery(where);
		return this.model.findOneAndUpdate(query, data, { new: true });
	}

	@fieldResolver(BookSchema, 'authors', [AuthorSchema])
	getBookAuthors(@parent() book: BookSchema, @arg() query: AuthorFilter, @context() context: any) {
		return this.findAuthors({ ...query, _id: { IN: book.authorIds } }, null, null, context);
	}
}
