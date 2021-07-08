import { Reflector } from '@davinci/reflector';
import { graphql } from '../../../src';

describe('decorators', () => {
	describe('@middleware()', () => {
		it('should add the middleware functions in the right order', () => {
			const firstMw = () => {};
			const secondMw = () => {};
			const thirdMw = () => {};

			@graphql.middleware(firstMw)
			class Base {}

			@graphql.middleware(secondMw)
			class Controller extends Base {
				@graphql.middleware(thirdMw)
				method() {}
			}

			const middlewares = Reflector.getMetadata('davinci:graphql:middleware', Controller);

			middlewares[0].middlewareFunction.should.be.equal(firstMw);
			middlewares[1].middlewareFunction.should.be.equal(secondMw);
			middlewares[2].middlewareFunction.should.be.equal(thirdMw);
		});
	});

	describe('@fieldResolver()', () => {
		it('should decorate a method correctly', () => {
			class Book {}
			class Author {
				@graphql.field()
				title: string;
			}

			// @ts-ignore
			class AuthorController {
				@graphql.fieldResolver(Book, 'authors', [Author])
				getBookAuthors() {}
			}

			const middlewares = Reflector.getMetadata('davinci:graphql:field-resolvers', Book);
			middlewares.should.have.length(1);
			middlewares[0].should.be.deepEqual({
				fieldName: 'authors',
				handler: AuthorController.prototype.getBookAuthors,
				methodName: 'getBookAuthors',
				prototype: AuthorController.prototype,
				resolverOf: Book,
				returnType: [Author]
			});
		});

		it('should allow multiple decorators for the different resolverOf & fieldName', () => {
			class Book {}
			class Film {}
			class Author {
				@graphql.field()
				title: string;
			}

			class AuthorController {
				@graphql.fieldResolver(Film, 'writers', [Author])
				@graphql.fieldResolver(Book, 'authors', [Author])
				getAuthors() {}
			}

			const bookResolvers = Reflector.getMetadata('davinci:graphql:field-resolvers', Book);
			bookResolvers.should.have.length(1);
			bookResolvers[0].should.be.deepEqual({
				fieldName: 'authors',
				handler: AuthorController.prototype.getAuthors,
				methodName: 'getAuthors',
				prototype: AuthorController.prototype,
				resolverOf: Book,
				returnType: [Author]
			});

			const filmResolvers = Reflector.getMetadata('davinci:graphql:field-resolvers', Film);
			filmResolvers.should.have.length(1);
			filmResolvers[0].should.be.deepEqual({
				fieldName: 'writers',
				handler: AuthorController.prototype.getAuthors,
				methodName: 'getAuthors',
				prototype: AuthorController.prototype,
				resolverOf: Film,
				returnType: [Author]
			});
		});

		it('throws an error when additional fieldResolvers are defined for the same resolverOf+fieldName', () => {
			class Book {}
			class Author {
				@graphql.field()
				title: string;
			}

			class AuthorController { getBookAuthors() {} }
			class AnotherController { getMoreAuthors() {} }

			try {
				graphql.fieldResolver(Book, 'authors', [Author])(AuthorController.prototype, 'getBookAuthors', null);
				graphql.fieldResolver(Book, 'authors', [Author])(AnotherController.prototype, 'getMoreAuthors', null);
				throw new Error('the above code should have thrown an error');
			} catch (err) {
				err.should.have.property('message').equal('\'Book.authors\' already resolved by AuthorController.getBookAuthors');
			}
		});
	});
});
