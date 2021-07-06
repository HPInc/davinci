/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import express from 'express';
import { DaVinciExpress } from '@davinci/core';
import should from 'should';
import supertest from 'supertest';

import { graphql, createGraphQLServer } from '../../src';

describe('server instantiation', () => {
	let app: DaVinciExpress;

	beforeEach(() => {
		app = express() as DaVinciExpress;
	});

	describe('#createGraphQLServer', () => {
		it('should mount the graphql middleware in POST /graphql', async () => {
			class Customer {
				@graphql.field()
				firstname: string;
				@graphql.field()
				age: number;
			}

			class CustomerController {
				@graphql.query([Customer])
				customers() {
					return [{ firstname: 'John', age: 20 }];
				}
			}

			createGraphQLServer(app, [CustomerController]);

			// verify that the middleware is in the express stack
			const route = app._router.stack.find(({ name }) => name === 'graphqlMiddleware');
			should(route).be.ok();

			// test the endpoint
			const response = await supertest(app)
				.post('/graphql')
				.send({ query: 'query{customers { firstname age }}' })
				.expect(200);

			response.body.should.be.deepEqual({
				data: {
					customers: [
						{
							firstname: 'John',
							age: 20
						}
					]
				}
			});
			response.statusCode.should.be.equal(200);
		});
	});
});
