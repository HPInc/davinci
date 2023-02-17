import { app } from '../../src';
import { expect } from '../support/chai';

describe('Customer integration tests', () => {
	before(async () => {
		await app.init();
	});

	after(async () => {
		await app.shutdown();
	});

	describe('GET /api/customers', () => {
		it('should return a list of customers', async () => {
			const result = await app.locals.injectHttpRequest({
				method: 'get',
				path: '/api/customers',
				query: { 'where[firstname]': 'John', 'where[lastname]': 'Doe' },
				headers: {
					'x-accountid': '12345'
				}
			});
			const payload = await result.json();

			expect(result.statusCode).to.be.equal(200);
			expect(payload).to.be.deep.equal({
				customers: [
					{
						firstname: 'Mike',
						lastname: 'Bibby'
					}
				],
				where: {
					firstname: 'John',
					lastname: 'Doe'
				}
			});
		});
	});

	describe('POST /api/customers', () => {
		it('should create a customer', async () => {
			const result = await app.locals.injectHttpRequest({
				method: 'post',
				path: '/api/customers',
				payload: {
					firstname: 'John',
					lastname: 'Doe'
				},
				headers: {
					'x-accountid': '12345'
				}
			});
			const payload = await result.json();

			expect(result.statusCode).to.be.equal(201);
			expect(payload).to.be.deep.equal({
				success: true,
				data: {
					firstname: 'John',
					lastname: 'Doe'
				}
			});
		});
	});
});
