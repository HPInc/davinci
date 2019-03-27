const should = require('should');
const sinon = require('sinon');
const Resource = require('../../src/rest/swagger/Resource');
const testDef = require('../support/test.def.js');

describe('Resource', () => {
	const makeDef = () => JSON.parse(JSON.stringify(testDef));

	it('should create a resource from a standard swagger definition structure', async () => {
		const resource = new Resource('/api', makeDef());
		resource.should.have.property('paths');
		resource.should.have.property('definitions');
	});

	it('should create a resource from a standard swagger definition structure even with invalid responses', async () => {
		const swagger = makeDef();
		delete swagger.paths['/custom'].get.responses;
		const resource = new Resource('/api', swagger);
		resource.should.have.property('paths');
		resource.should.have.property('definitions');
	});
});
