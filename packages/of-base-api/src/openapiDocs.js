const debug = require('debug')('of-base-api');
const express = require('express');
const _ = require('lodash');
const path = require('path');
const Resource = require('./openapiResource');

const swaggerUiAssetPath = path.resolve(path.join(__dirname, 'explorer'));

const SWAGGER_VERSION = '2.0';
// const router = express.Router();

const resources = [];

const addResource = (resourceName, doc) => {
	debug(`adding ${resourceName} resource`);
	// create the resource from the doc
	const resource = new Resource(resourceName, doc);
	// add it to the registry
	resources.push(resource);
};

const createApiDocs = (app, opts) => {

	debug(`setting up swagger docs on ${opts.discoveryUrl}`);

	app.get(opts.discoveryUrl, (req, res) => {

		const basePath = opts.basePath || `http://${req.headers.host}/api`;

		const fullSwagger = {
			swagger: SWAGGER_VERSION,
			info: {
				version: '1.0.0',
				title: 'File API'
			},
			schemes: [req.get('X-Forwarded-Protocol') || req.protocol || 'https'],
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
			_.each(resource.paths, (resourcePath, pathName) => {
				let fullPath = `/${resource.basePath}${pathName}`;
				if (pathName === '/') fullPath = `/${resource.basePath}`;
				fullSwagger.paths[fullPath] = resourcePath;
			});
		});

		res.json(fullSwagger);
	});

	// return app;
};

const explorer = (app, opts) => {
	// add the swagger explorer page
	app.use('/explorer', express.static(swaggerUiAssetPath));

	// add the swagger api docs
	createApiDocs(app, opts);
};

module.exports = {
	createApiDocs,
	addResource,
	explorer
};
