const boot = require('../../src/index');
const customerAPI = require('./customers/customer.api');
const fileAPI = require('./files/file.api');
const searchAPI = require('./search/search.api');

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

	app.use('/api/customer', customerAPI.router);
	app.use('/api/file', fileAPI.router);
	app.use('/api/search', searchAPI.router);
});
