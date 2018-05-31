const should = require('should');
const path = require('path');
const sinon = require('sinon');
const baseService = require('../../src/baseService');

describe('baseService', () => {
	it('should successfully create a service', async () => {
		const service = {
			find: (q, params) => Promise.resolve([1, 2, 3])
		}

		Object.assign(service, baseService);
		service.should.have.property('findOne');
	});

	it('should result a single result from an array of data', async () => {
		const query = {};
		const params = {};
		const service = {
			find: (q, params) => Promise.resolve([1, 2, 3])
		}

		Object.assign(service, baseService);

		const results = await service.findOne(query, params);
		results.should.equal(1);
	});

	it('should result a single result from an object.data', async () => {
		const query = {};
		const params = {};
		const service = {
			find: (q, params) => Promise.resolve({ data: [1, 2, 3] })
		}

		Object.assign(service, baseService);

		const results = await service.findOne(query, params);
		results.should.equal(1);
	});

});

