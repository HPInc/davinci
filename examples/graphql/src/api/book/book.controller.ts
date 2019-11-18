import { graphql } from '@davinci/graphql';
import { context } from '@davinci/core';
import model from './book.model';
import BookSchema, { BookQuery } from './book.schema';
import { AuthorSchema } from '../index';

const { query, mutation, arg, fieldResolver, parent, info, selectionSet } = graphql;

export default class BookController {
	model = model;

	@query(BookSchema, 'bookById')
	getBookById(@arg('id', { required: true }) id: string) {
		return this.model.findById(id);
	}

	@query([BookSchema], 'books')
	findBooks(@arg('query') query: BookQuery, @context() context: any, @info() info, @selectionSet() selectionSet) {
		console.log(info, selectionSet);
		return this.model.find(query, {}, { context });
	}

	@mutation(BookSchema, 'createBook')
	createBook(
		@arg('data', { required: true })
		data: BookSchema
	) {
		return this.model.create(data);
	}

	@mutation(BookSchema)
	updateBookById(@arg('id', { required: true }) id: string, @arg('data', { required: true }) data: BookSchema) {
		return this.model.findByIdAndUpdate(id, data, { new: true });
	}

	@fieldResolver<AuthorSchema>(AuthorSchema, 'books', [BookSchema])
	getAuthorBooks(@parent() author: AuthorSchema, @arg('query') query: BookQuery, @context() context: any) {
		console.log(query);
		// @ts-ignore
		return this.findBooks({ ...query, authorIds: author.id }, context);
	}
}
