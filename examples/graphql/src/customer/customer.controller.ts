import { graphql } from '@davinci/graphql';
import model from './customer.model';
import CustomerSchema, { CustomerQuery } from './customer.schema';

export default class CustomerController {
	model = model;

	@graphql.query(CustomerSchema, 'customerById')
	getCustomerById(@graphql.arg('id', { required: true }) id: string) {
		return this.model.findById(id);
	}

	@graphql.query([CustomerSchema], 'customers')
	findCustomers(@graphql.arg('query') query: CustomerQuery) {
		return this.model.find(query);
	}

	@graphql.mutation(CustomerSchema, 'createCustomer')
	createCustomer(
		@graphql.arg('data', { required: true })
		data: CustomerSchema
	) {
		return this.model.create(data);
	}

	@graphql.mutation(CustomerSchema)
	updateCustomerById(
		@graphql.arg('id', { required: true }) id: string,
		@graphql.arg('data', { required: true }) data: CustomerSchema
	) {
		return this.model.findByIdAndUpdate(id, data, { new: true });
	}
}
