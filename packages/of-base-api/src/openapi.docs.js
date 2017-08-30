// const express = require('express');
const _ = require('lodash');
const Resource = require('./openapi.resource');

const SWAGGER_VERSION = '2.0';
// const router = express.Router();

const resources = [];

const addResource = (path, doc) => {
	console.log(`adding ${path} resource`);
	// create the resource from the doc
	const resource = new Resource(path, doc);
	// add it to the registry
	resources.push(resource);
};

const createApiDocs = (app, opts) => {

	console.log(`setting up swagger docs on ${opts.discoveryUrl}`);

	app.get(opts.discoveryUrl, (req, res) => {

		const basePath = opts.basePath || `http://${req.headers.host}/api`;

		const fullSwagger = {
			swagger: SWAGGER_VERSION,
			info: {
				version: '1.0.0',
				title: 'File API'
			},
			schemes: ['https'],
			basePath,
			host: req.headers.host,
			paths: {},
			definitions: {},
			parameters: {}
		};

		resources.forEach(resource => {

			// add definitions
			_.each(resource.definitions, (resourceDefinition, defName) => {
				fullSwagger.definitions[defName] = resourceDefinition;
			});

			// add parameters
			_.each(resource.parameters, (resourceParameter, paramName) => {
				fullSwagger.parameters[paramName] = resourceParameter;
			});

			// add paths
			_.each(resource.paths, (path, pathName) => {
				let _path = `/${resource.basePath}${pathName}`;
				if (pathName === '/') _path = `/${resource.basePath}`;
				fullSwagger.paths[_path] = path;
			});
		});

		res.json(fullSwagger);
	});

	// return app;
};

const explorer = (app, opts) => {
	// add the swagger explorer page
	// app.use('/explorer', express.static('src/explorer'));

	// add the swagger api docs
	createApiDocs(app, opts);
};

module.exports = {
	createApiDocs,
	addResource,
	explorer
};
