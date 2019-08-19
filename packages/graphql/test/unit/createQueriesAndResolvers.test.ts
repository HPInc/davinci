// import should from 'should';
import { createQueriesAndResolvers } from '../../src/createQueriesAndResolvers';
import { graphql } from '../../src';

const { query, field, arg } = graphql;

describe('createQueriesAndResolvers', () => {
	class Customer {
		@field()
		firstname: string;
		@field()
		age: number;
		@field()
		isActive: boolean;
	}

	class Controller {
		@query(Customer)
		customers(@arg('page') page: string) {
			return page;
		}
	}

	const { queries } = createQueriesAndResolvers(Controller);

	console.log(queries);
});

