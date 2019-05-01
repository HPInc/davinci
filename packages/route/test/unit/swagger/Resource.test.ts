import should from 'should';
import Resource from '../../../src/swagger/Resource';

describe('Resource', () => {
	const makeDef = () => ({
		paths: {
			'/custom': { get: { responses: { 200: {} } } }
		},
		definitions: {}
	});

	it('should create a resource from a standard swagger definition structure', async () => {
		const resource = new Resource('/api', makeDef());
		should(resource).have.property('paths');
		should(resource).have.property('definitions');
	});

	it('should create a resource from a standard swagger definition structure even with invalid responses', async () => {
		const swagger = makeDef();
		// @ts-ignore
		delete swagger.paths['/custom'].get.responses;
		const resource = new Resource('/api', swagger);
		should(resource).have.property('paths');
		should(resource).have.property('definitions');
	});
});
