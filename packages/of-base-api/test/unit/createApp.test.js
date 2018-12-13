const should = require('should');
const path = require('path');
const sinon = require('sinon');
const express = require('express');
const { processArgs, createApp, configureExpress } = require('../../src/createApp');

describe('createApp', () => {

	const makeApp = () => {
		return {
			listener: sinon.stub(),
			listen: sinon.stub(),
			use: sinon.stub(),
			listen: sinon.stub(),
			get: sinon.stub()
		}
	};

	describe('processArgs', () => {

		// processArgs(runMiddlewares) -> Promise
		// processArgs(app, runMiddlewares) -> Promise
		// processArgs(app, options, runMiddlewares) -> Promise

		it('Should successfully create an app with no args', () => {
			const [app, options, runMiddlewares] = processArgs();
			app.should.have.property('use');
			options.should.be.empty;
			runMiddlewares.should.be.Function;
		});

		it('Should successfully create an app with a single middleware function', () => {
			const fn = () => { }
			const [app, options, runMiddlewares] = processArgs(fn);
			app.should.have.property('use');
			options.should.be.empty;
			runMiddlewares.should.be.Function;
		});

		it('Should successfully create an app with an app, options and middleware function', () => {
			const fn = () => { }
			const myApp = makeApp();
			const [app, options, runMiddlewares] = processArgs(myApp, fn);
			app.should.have.property('use');
			options.should.be.empty;
			runMiddlewares.should.be.Function;
		});

		it('Should successfully create an app with an app, options and middleware function', () => {
			const fn = () => { }
			const myOptions = { boot: 'dir' };
			const myApp = makeApp();
			const [app, options, runMiddlewares] = processArgs(myApp, myOptions, fn);
			app.should.have.property('use');
			options.should.deepEqual({ boot: 'dir' });
			runMiddlewares.should.be.Function;
		});

	});

	describe('configureExpress', () => {

		it('Should successfully configure an express app with no middleware', () => {
			const app = makeApp();
			configureExpress(app);
			app.should.have.property('use');
		});

		it('Should successfully configure an express app with added middleware', () => {
			const app = makeApp();
			const middlewares = app => {
				app.should.have.property('use');
			};
			configureExpress(app, middlewares);
			app.should.have.property('use');
		});

	});

	describe('createApp', () => {

		it('Should successfully configure an express app with no middleware', async () => {
			const { server } = await createApp();
			server.should.have.property('listen');
			server.close();
		});

		it('Should successfully configure an express app with middleware', async () => {
			const myApp = express();
			const middlewares = app => {
				app.should.have.property('use');
			};
			const { server } = await createApp(myApp, middlewares);
			server.should.have.property('listen');
			server.close();
		});

		it('Should successfully configure an express app with middleware', async () => {
			const myApp = express();
			const middlewares = app => {
				app.should.have.property('use');
			};
			const myOptions = { boot: 'dir' };
			const { server } = await createApp(myApp, myOptions, middlewares);
			server.should.have.property('listen');
			server.close();
		});

	});
});

