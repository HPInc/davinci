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

		it('should ignore duplicate decorators for the same fieldName', () => {
			class Book {}
			class Author {
				@graphql.field()
				title: string;
			}
			class Nope {}

			// @ts-ignore
			class AuthorController {
				// decorators of the same type are executed from bottom to top. see:
				// https://www.typescriptlang.org/docs/handbook/decorators.html#decorator-composition
				@graphql.fieldResolver(Book, 'authors', [Nope])
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
	});
});
