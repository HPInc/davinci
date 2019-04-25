import express from 'express';
import Debug from 'debug';
import { createApp, createRouter, IOfBaseExpress } from '../../src';
import CustomerController from './customer/customer.controller';
import FileController from './file/file.controller';

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

const expressApp = express();

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
	app.use(createRouter(FileController));
	// app.use('/api/search', createRouter(SearchController));
});

if (require.main === module) {
	// this module was run directly from the command line as in node xxx.js
	(expressApp as IOfBaseExpress).start();
}

export default expressApp;
