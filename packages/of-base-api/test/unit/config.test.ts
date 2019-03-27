describe('config', () => {
	it('should create a correct config', () => {
		const config = require('../../src/config');
		config.should.have.properties(['PORT', 'PROTOCOL']);
	});
});
