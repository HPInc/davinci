import express from 'express';
const debug = require('debug')('of-base-api:example');
const { createApp, createRouter } = require('../../src');
import CustomerController from './customer/customer.controller';
import FileController from './file/file.controller';
import { IOfBaseExpress } from '../../src';
// const FileController = require('./files/FileController');
// const SearchController = require('./search/search.controller');

const bootOptions: { bootDirPath?: string } = {};
bootOptions.bootDirPath = './build/examples/crm/boot';
const expressApp = express();

createApp(expressApp, bootOptions, app => {
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
