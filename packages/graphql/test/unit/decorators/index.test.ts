import { Reflector } from '@davinci/reflector';
import { graphql } from '../../../src';

describe('decorators', () => {
	describe('middleware', () => {
		it('should add the middleware functions in the right order', () => {
			const firstMw = () => {};
			const secondMw = () => {};

			@graphql.middleware(firstMw)
			class Base {}

			@graphql.middleware(secondMw)
			class Controller extends Base {}

			const middlewares = Reflector.getMetadata('davinci:graphql:middleware', Controller);

			middlewares[0].middlewareFunction.should.be.equal(firstMw);
			middlewares[1].middlewareFunction.should.be.equal(secondMw);
		});
	});
});
