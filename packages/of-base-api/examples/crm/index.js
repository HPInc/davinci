const boot = require('../../');
const CustomerController = require('./customer/CustomerController');
const FileController = require('./files/FileController');
const SearchController = require('./search/SearchController');
const { createRouter } = require('../../');

boot(app => {
	// add some middleware
	app.use((req, res, next) => {
		console.log('logger', req.hostname, req.method, req.path);
		req.contextId = '5992c4e74219261300661ccc';
		next();
	});

	// add a custom route
	app.get('/hello-world', (req, res) => {
		res.send({
			message: 'Hello World'
		});
	});

	app.use('/api/customer', createRouter(CustomerController));
	app.use('/api/file', createRouter(FileController));
	app.use('/api/search', createRouter(SearchController));
});
