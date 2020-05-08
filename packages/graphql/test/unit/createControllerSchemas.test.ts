import should from 'should';
import { createControllerSchemas } from '../../src';
import { GraphQLInputObjectType, GraphQLObjectType, GraphQLScalarType } from 'graphql';
import { graphql } from '../../src';
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
			fetchCustomers(@arg() page: string) {
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
			createCustomer(@arg() customer: Customer) {
				return customer;
			}
		}

		const { mutations } = createControllerSchemas(Controller);

		should(mutations).have.property('createCustomer');
		should(mutations.createCustomer).have.property('args');
		should(mutations.createCustomer.args).have.property('customer');
		should(mutations.createCustomer.args.customer.type).be.instanceOf(GraphQLInputObjectType);
		should(mutations.createCustomer.args.customer.type.name).be.equal('CustomerMutationInput');
		should(mutations.createCustomer.type).be.instanceOf(GraphQLObjectType);
		should(mutations.createCustomer.type.name).be.equal(Customer.name);
		should(mutations.createCustomer.resolve).be.instanceOf(Function);
	});

	it('should propagate correctly the arguments to the decorators options factory functions #1', done => {
		class Customer {
			@field(({ isInput, operationType, resolverMetadata }) => {
				should(isInput).be.True();
				should(operationType).be.equal('query');
				should(resolverMetadata).be.deepEqual({
					methodName: 'fetchCustomers',
					name: 'customers',
					handler: Controller.prototype.fetchCustomers,
					returnType: String
				});
				done();
				return {};
			})
			firstname: string;
		}

		class Controller {
			@query(String, 'customers')
			fetchCustomers(@arg() customer: Customer) {
				return customer.firstname;
			}
		}

		createControllerSchemas(Controller);
	});

	it('should propagate correctly the arguments to the decorators options factory functions #2', done => {
		class Customer {
			@field(({ isInput, operationType, resolverMetadata }) => {
				should(isInput).be.False();
				should(operationType).be.equal('query');
				should(resolverMetadata).be.deepEqual({
					methodName: 'fetchCustomer',
					name: 'customer',
					handler: Controller.prototype.fetchCustomer,
					returnType: Customer
				});
				done();
				return {};
			})
			firstname: string;
		}

		class Controller {
			@query(Customer, 'customer')
			fetchCustomer(@arg() firstname: string) {
				const customer = new Customer();
				customer.firstname = firstname;
				return customer;
			}
		}

		createControllerSchemas(Controller);
	});

	it('should propagate correctly the arguments to the decorators options factory functions #3', done => {
		class Customer {
			@field(({ isInput, operationType, resolverMetadata }) => {
				should(isInput).be.True();
				should(operationType).be.equal('mutation');
				should(resolverMetadata).be.deepEqual({
					methodName: 'writeCustomers',
					name: 'customers',
					handler: Controller.prototype.writeCustomers,
					returnType: String
				});
				done();
				return {};
			})
			firstname: string;
		}

		class Controller {
			@mutation(String, 'customers')
			writeCustomers(@arg() customer: Customer) {
				return customer.firstname;
			}
		}

		createControllerSchemas(Controller);
	});

	it('should propagate correctly the arguments to the decorators options factory functions #4', done => {
		class Customer {
			@field(({ isInput, operationType, resolverMetadata }) => {
				should(isInput).be.False();
				should(operationType).be.equal('mutation');
				should(resolverMetadata).be.deepEqual({
					methodName: 'writeCustomer',
					name: 'customer',
					handler: Controller.prototype.writeCustomer,
					returnType: Customer
				});
				done();
				return {};
			})
			firstname: string;
		}

		class Controller {
			@mutation(Customer, 'customer')
			writeCustomer(@arg() firstname: string) {
				const customer = new Customer();
				customer.firstname = firstname;
				return customer;
			}
		}

		createControllerSchemas(Controller);
	});
});
