import express, { Express } from 'express';
import Debug from 'debug';
import { createApp, IOfBaseExpress } from '@of-base-api/core';
import { createRouter } from '@of-base-api/route';
import CustomerController from './customer/customer.controller';

const debug = Debug('of-base-api:example');
// const FileController = require('./files/FileController');
// const SearchController = require('./search/search.controller');

const options = {
	boot: {
		dirPath: './build/examples/crm/boot'
	},
	healthChecks: {
		readynessEndpoint: '/.ah/ready',
		livenessEndpoint: '/.ah/live'
	}
};

const expressApp: Express = express();

createApp(expressApp, options, app => {
	// add some middleware
	app.use((req, _res, next) => {
		debug('logger', req.hostname, req.method, req.path);
		req.contextId = '5992c4e74219261300661ccc';
		next();
	});

	// add a custom route
	app.get('/hello-world', (_req, res) => {
		res.send({
			message: 'Hello World'
		});
	});

	app.use(createRouter(CustomerController));
});

if (require.main === module) {
	// this module was run directly from the command line as in node xxx.js
	(expressApp as IOfBaseExpress).start();
}

export default expressApp;
