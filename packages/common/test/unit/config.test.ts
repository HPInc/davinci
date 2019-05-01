import should from 'should';
import config from '../../src/config';

describe('config', () => {
	it('should create a correct config', () => {
		should(config).have.properties(['PORT', 'PROTOCOL']);
	});
});
