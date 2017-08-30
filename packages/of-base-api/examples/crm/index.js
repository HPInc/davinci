const express = require('express');
const mongoose = require('mongoose');
const customerAPI = require('./customers/customer.api');
const fileAPI = require('./files/file.api');
const docs = require('../../src/openapi.docs');

mongoose.Promise = global.Promise;
mongoose.set('debug', true);

// create a normal express app
const app = express();

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

// //////////////////////////////////////////
// this is the new API routes being added in

app.use('/api/customer', customerAPI.router);
app.use('/api/file', fileAPI.router);

docs.explorer(app, {
	discoveryUrl: '/api-doc.json',
	version: '1.0',  // read from package.json
	basePath: '/api'
});

// //////////////////////////////////////////

// back to final routes
require('../../src/middleware/error-handler');

// normal express listener
mongoose.connect('mongodb://localhost/files-api', { useMongoClient: true }).then(
	() => {
		app.listen(3000, () => console.log('Example app listening on port 3000!'));

	},
	err => console.error
);
