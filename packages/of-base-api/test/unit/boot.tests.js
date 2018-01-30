const should = require('should');
const path = require('path');
const sinon = require('sinon');
const boot = require('../../src/boot');

describe('boot', () => {
	describe('#checkAndAssignBootDir', () => {
		it('Should throw error if unable to find "boot" or "src/boot" in current directory', async () => {
			const app = {
				use: sinon.stub(),
				listen: sinon.stub()
			};

			try {
				await boot(app)
			} catch (err) {
				should(err).be.Error();
				err.message.should.match('Cannot find boot directory or boot is not a directory');
			}
		});

		it('Should successfully boot', (done) => {
			const app = {
				use: sinon.stub(),
				listen: sinon.stub()
			};
			const options = {
				bootDirPath: 'examples/crm/boot'
			};

			boot(app, options, () => {
				done()
			});
		})
	})
});

