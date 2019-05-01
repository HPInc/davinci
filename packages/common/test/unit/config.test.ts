import should from 'should';
import { config } from '@of-base-api/common';

describe('config', () => {
	it('should create a correct config', () => {
		should(config).have.properties(['PORT', 'PROTOCOL']);
	});
});
