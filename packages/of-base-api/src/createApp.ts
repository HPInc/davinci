import Debug from 'debug';
import express from 'express';
import http from 'http';
import responseHandler from './responseHandler';
import errorHandler from './errorHandler';
import notFoundHandler from './notFoundHandler';
import config from './config';
import { execBootScripts } from './boot';
import * as docs from './route/swagger/openapiDocs';
import { IOfBaseExpress } from './types';

const debug = Debug('of-base-api');

export const processArgs = (...args) => {
	/*
		options are either
		createApp(runMiddlewares) -> Promise
		createApp(app, runMiddlewares) -> Promise
		createApp(app, options, runMiddlewares) -> Promise
	*/

	let [app, options, runMiddlewares] = args;

	if (args.length === 0) {
		// createApp()
		app = express();
	} else if (args.length === 1) {
		// createApp(runMiddlewares)
		runMiddlewares = app;
		app = express();
	} else if (args.length === 2) {
		// createApp(app, runMiddlewares)
		runMiddlewares = options;
	}
	if (!options) options = {};
	if (!runMiddlewares) runMiddlewares = () => {};
	// if (args.length === 3) then no change

	// for 3 arguments then we can assume app, options and callback are set
	return [app, options, runMiddlewares];
};

export const configureExpress = (app, runMiddlewares?) => {
	// this is at the start
	app.use(express.json({ limit: '1mb' }));
	app.use(express.urlencoded({ extended: true }));

	// middlewares
	if (runMiddlewares) runMiddlewares(app);

	// add the swagger routes
	docs.explorer(app, {
		discoveryUrl: '/api-doc.json',
		version: '1.0', // read from package.json
		basePath: '/api'
	});
	app.use(responseHandler());
	app.use(notFoundHandler());
	app.use(errorHandler({}));
};

export const createApp = async (...args): Promise<IOfBaseExpress> => {
	// process the arguments
	const [app, options, addMiddlewares] = processArgs(...args);

	app.start = async () => {
		// run the boot executions
		await execBootScripts(app, options);

		// configure the express app
		await configureExpress(app, addMiddlewares);

		// run the listener
		const server = http.createServer(app);
		await new Promise(resolve =>
			server.listen(config.PORT, () => {
				debug(`Server listening on ${config.PORT}`);
				resolve();
			})
		);
		app.server = server;

		return { app, server };
	};

	app.close = () => {
		if (app.server) {
			return app.server.close();
		}

		console.warn('Server not initialised, ignoring');
	};

	return app;
};
