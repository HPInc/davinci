const { createApp, createRouter } = require('../../');
const debug = require('debug')('of-base-api:example');
import CustomerController from './customer/customer.controller';
// const FileController = require('./files/FileController');
const SearchController = require('./search/search.controller');

createApp(app => {
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

	app.use('/api/customer', createRouter(CustomerController));
	// app.use('/api/file', createRouter(FileController));
	app.use('/api/search', createRouter(SearchController));
});
