import { graphql } from '@davinci/graphql';
import { context } from '@davinci/core';
import model from './author.model';
import AuthorSchema, { AuthorQuery } from './author.schema';
import { BookSchema } from '../index';

const { query, parent, mutation, fieldResolver, arg } = graphql;

export default class AuthorController {
	model = model;

	@query(AuthorSchema, 'authorById')
	getAuthorById(@arg('id', { required: true }) id: string) {
		return this.model.findById(id);
	}

	@query([AuthorSchema], 'authors')
	findAuthors(@arg() query: AuthorQuery, @context() context: any) {
		return this.model.find(query, {}, { context });
	}

	@mutation(AuthorSchema)
	createAuthor(@arg('data', { required: true }) data: AuthorSchema) {
		return this.model.create(data);
	}

	@mutation(AuthorSchema)
	updateAuthorById(@arg('id', { required: true }) id: string, @arg('data', { required: true }) data: AuthorSchema) {
		return this.model.findByIdAndUpdate(id, data, { new: true });
	}

	@fieldResolver<BookSchema>(BookSchema, 'authors', [AuthorSchema])
	getBookAuthors(@parent() book: BookSchema, @arg() query: AuthorQuery, @context() context: any) {
		console.log(query);
		// @ts-ignore
		return this.findAuthors({ ...query, _id: { $in: book.authorIds } }, context);
	}
}
