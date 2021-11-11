import should from 'should';
// import path from 'path';
import sinon from 'sinon';
import express from 'express';
import { processArgs, createApp, configureExpress } from '../../src/createApp';

describe('createApp', () => {
	const makeApp = () => {
		return {
			listener: sinon.stub(),
			listen: sinon.stub(),
			use: sinon.stub(),
			get: sinon.stub()
		};
	};

	describe('processArgs', () => {
		// processArgs(runMiddlewares) -> Promise
		// processArgs(app, runMiddlewares) -> Promise
		// processArgs(app, options, runMiddlewares) -> Promise

		it('Should successfully create an app with no args', () => {
			const [app, options, runMiddlewares] = processArgs();
			should(app).have.property('use');
			options.should.be.empty;
			runMiddlewares.should.be.Function;
		});

		it('Should successfully create an app with a single middleware function', () => {
			const fn = () => {};
			const [app, options, runMiddlewares] = processArgs(fn);
			should(app).have.property('use');
			options.should.be.empty;
			runMiddlewares.should.be.Function;
		});

		it('Should successfully create an app with an app, options and middleware function', () => {
			const fn = () => {};
			const myApp = makeApp();
			const [app, options, runMiddlewares] = processArgs(myApp, fn);
			should(app).have.property('use');
			options.should.be.empty;
			runMiddlewares.should.be.Function;
		});

		it('Should successfully create an app with an app, options and middleware function', () => {
			const fn = () => {};
			const myOptions = { boot: 'dir' };
			const myApp = makeApp();
			const [app, options, runMiddlewares] = processArgs(myApp, myOptions, fn);
			should(app).have.property('use');
			options.should.deepEqual({ boot: 'dir' });
			runMiddlewares.should.be.Function;
		});
	});

	describe('configureExpress', () => {
		it('Should successfully configure an express app with no options and no middleware', () => {
			const app = makeApp();
			configureExpress(app);
			should(app).have.property('use');
		});
		it('Should successfully configure an express app with no middleware', () => {
			const app = makeApp();
			const options = { version: '1.1.1' };
			configureExpress(app, options);
			should(app).have.property('use');
		});

		it('Should successfully configure an express app with added middleware', () => {
			const app = makeApp();
			const options = { version: '1.1.1' };
			const middlewares = app => {
				should(app).have.property('use');
			};
			configureExpress(app, options, middlewares);
			should(app).have.property('use');
		});
	});

	describe('createApp', () => {
		let app;
		afterEach(() => {
			app.close();
		});

		it('Should successfully configure a http express app with no middleware', async () => {
			app = await createApp();
			await app.start();
			should(app.server).have.property('listen');
		});

		it('Should successfully configure a http express app with middleware', async () => {
			const myApp = express();
			const middlewares = app => {
				should(app).have.property('use');
			};
			app = await createApp(myApp, middlewares);
			await app.start();
			should(app.server).have.property('listen');
		});

		it('Should successfully configure a http express app with middleware', async () => {
			const myApp = express();
			const middlewares = app => {
				should(app).have.property('use');
			};
			const myOptions = {};
			app = await createApp(myApp, myOptions, middlewares);
			await app.start();
			should(app.server).have.property('listen');
		});

		it('Should successfully configure a http express app with middleware', async () => {
			const myApp = express();
			const middlewares = app => {
				should(app).have.property('use');
			};
			const myOptions = { tls: {} };
			app = await createApp(myApp, myOptions, middlewares);
			await app.start();
			should(app.server).have.property('listen');
		});

		it('Should successfully configure a http express app with middleware', async () => {
			const myApp = express();
			const middlewares = app => {
				should(app).have.property('use');
			};
			const myOptions = { tls: { key: 'key' } };
			app = await createApp(myApp, myOptions, middlewares);
			await app.start();
			should(app.server).have.property('listen');
		});

		it('Should successfully configure a https express app with middleware', async () => {
			const myApp = express();
			const middlewares = app => {
				should(app).have.property('use');
			};
			const myOptions = { tls: { key: 'key', cert: 'cert' } };
			app = await createApp(myApp, myOptions, middlewares);
			await app.start();
			should(app.server).have.property('listen');
		});
	});
});
