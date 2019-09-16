import should from 'should';
import { createControllerSchemas } from '../../src';
import { graphql } from '../../src';
import { GraphQLInputObjectType, GraphQLObjectType, GraphQLScalarType } from 'graphql';
import { mutation } from '../../src/decorators';

const { query, field, arg } = graphql;

describe('createControllerSchemas', () => {
	it('should create queries from a controller', () => {
		class Customer {
			@field()
			firstname: string;
			@field()
			age: number;
			@field()
			isActive: boolean;
		}

		class Controller {
			@query(Customer, 'customers')
			fetchCustomers(@arg('page') page: string) {
				return page;
			}
		}

		const { queries } = createControllerSchemas(Controller);

		should(queries).have.property('customers');
		should(queries.customers).have.property('args');
		should(queries.customers.args).have.property('page');
		should(queries.customers.args.page.type).be.instanceOf(GraphQLScalarType);
		should(queries.customers.type).be.instanceOf(GraphQLObjectType);
		should(queries.customers.type.name).be.equal(Customer.name);
		should(queries.customers.resolve).be.instanceOf(Function);
	});

	it('should create mutations from a controller', () => {
		class Customer {
			@field()
			firstname: string;
			@field()
			age: number;
			@field()
			isActive: boolean;
		}

		class Controller {
			@mutation(Customer, 'createCustomer')
			createCustomer(@arg('customer') customer: Customer) {
				return customer;
			}
		}

		const { mutations } = createControllerSchemas(Controller);

		should(mutations).have.property('createCustomer');
		should(mutations.createCustomer).have.property('args');
		should(mutations.createCustomer.args).have.property('customer');
		should(mutations.createCustomer.args.customer.type).be.instanceOf(GraphQLInputObjectType);
		should(mutations.createCustomer.args.customer.type.name).be.equal('CustomerInput');
		should(mutations.createCustomer.type).be.instanceOf(GraphQLObjectType);
		should(mutations.createCustomer.type.name).be.equal(Customer.name);
		should(mutations.createCustomer.resolve).be.instanceOf(Function);
	});
});
