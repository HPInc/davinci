import { graphql, queryHelpers } from '@davinci/graphql';
import { context } from '@davinci/core';
import model from './author.model';
import AuthorSchema, { AuthorFilter, AuthorPagination } from './author.schema';
import { BookSchema } from '../index';

const { query, parent, mutation, fieldResolver, arg, selectionSet, middleware } = graphql;

@middleware((_source, _args, context) => {
	console.log(context);
})
export default class AuthorController {
	model = model;

	@query(AuthorSchema, 'authorById')
	getAuthorById(@arg('id', { required: true }) id: string) {
		return this.model.findById(id);
	}

	@middleware((_source, _args, context) => {
		console.log(context);
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
	createAuthor(@arg('data', { required: true }) data: AuthorSchema) {
		return this.model.create(data);
	}

	@mutation(AuthorSchema)
	updateAuthorById(
		@arg('id', { required: true }) id: string,
		@arg('data', { required: true, partial: true }) data: AuthorSchema
	) {
		return this.model.findByIdAndUpdate(id, data, { new: true });
	}

	@mutation(AuthorSchema)
	updateAuthor(@arg() where: AuthorFilter, @arg('data', { required: true, partial: true }) data: AuthorSchema) {
		const query = queryHelpers.toMongodbQuery(where);
		return this.model.findOneAndUpdate(query, data, { new: true });
	}

	@fieldResolver(BookSchema, 'authors', [AuthorSchema])
	getBookAuthors(@parent() book: BookSchema, @arg() query: AuthorFilter, @context() context: any) {
		return this.findAuthors({ ...query, _id: { IN: book.authorIds } }, null, null, context);
	}
}
