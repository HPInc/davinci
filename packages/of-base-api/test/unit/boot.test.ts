import should from 'should';
import sinon from 'sinon';
import process from 'process';
import { checkAndAssignBootDir, execBootScripts } from '../../src/boot';

describe('boot', () => {
	let cwdStub;

	before(() => {
		// set our current working directory to this unit test's directory
		cwdStub = sinon.stub(process, 'cwd').callsFake(() => __dirname);
	});

	after(() => {
		if (cwdStub) cwdStub.restore();
	});

	describe('#checkAndAssignBootDir', () => {
		it('Should successfully check and assign a default boot dir', () => {
			const options = {}; // no bootDirPath
			const validPaths = checkAndAssignBootDir(options);
			should(validPaths).be.String();
		});

		it('Should successfully check and assign a default boot dir', () => {
			const options = {
				bootDirPath: 'src/boot'
			};
			const validPaths = checkAndAssignBootDir(options);
			should(validPaths).be.String();
		});

		it('Should ignore an invalid default boot dir', () => {
			const options = {
				bootDirPath: 'invalid-dir'
			};
			const validPaths = checkAndAssignBootDir(options);
			should(validPaths).be.String();
		});
	});

	describe('#execBootScripts', async () => {
		it('Should successfully check and assign a default boot dir', async () => {
			const app = sinon.mock();
			const options = {}; // no bootDirPath
			const newApp = await execBootScripts(app, options);
			should(newApp).be.Array().of.length(1);
			// there is a test boot script called stub.js that returns ['complete']
			newApp[0].should.equal('complete');
		});
	});
});
