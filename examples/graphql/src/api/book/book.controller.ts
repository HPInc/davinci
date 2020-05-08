import { graphql } from '@davinci/graphql';
import { context as ctx } from '@davinci/core';
import model from './book.model';
import BookSchema, { BookFilter } from './book.schema';
import { AuthorSchema } from '../index';

const { query, mutation, arg, fieldResolver, parent, info, selectionSet } = graphql;

export default class BookController {
	model = model;

	@query(BookSchema, 'bookById')
	getBookById(@arg({ required: true }) id: string) {
		return this.model.findById(id);
	}

	@query([BookSchema], 'books')
	findBooks(@arg() query: BookFilter, @ctx() context: any, @info() gqlInfo, @selectionSet() gqlSelectionSet) {
		console.log(gqlInfo, gqlSelectionSet);
		return this.model.find(query, {}, { context });
	}

	@mutation(BookSchema, 'createBook')
	createBook(@arg({ required: true }) data: BookSchema) {
		return this.model.create(data);
	}

	@mutation(BookSchema)
	updateBookById(@arg({ required: true }) id: string, @arg({ required: true }) data: BookSchema) {
		return this.model.findByIdAndUpdate(id, data, { new: true });
	}

	@fieldResolver<AuthorSchema>(AuthorSchema, 'books', [BookSchema])
	getAuthorBooks(@parent() author: AuthorSchema, @arg() query: BookFilter, @ctx() context: any) {
		return this.model.find({ ...query, authorIds: author.id }).setOptions({ context });
	}
}
