const debug = require('debug')('of-base-api');
const express = require('express');
const _ = require('lodash');
const path = require('path');
const Resource = require('./Resource');
const config = require('./config');

const swaggerUiAssetPath = path.resolve(path.join(__dirname, 'explorer'));

const SWAGGER_VERSION = '2.0';

const resources = [];

export const addResource = (resourceName, doc) => {
	debug(`adding ${resourceName} resource`);
	// create the resource from the doc
	const resource = new Resource(resourceName, doc);
	// add it to the registry
	resources.push(resource);
};

export const createApiDocs = (app, opts:any = {}) => {

	debug(`setting up swagger docs on ${opts.discoveryUrl}`);

	const makeHandler = () => {
		return (req, res) => {
			const protocol = opts.protocol || config.PROTOCOL;
			const basePath = opts.basePath || `${protocol}://${req.headers.host}/api`;
			const fullSwagger = {
				swagger: SWAGGER_VERSION,
				info: {
					version: opts.version || '1.0.0',
					title: opts.title || 'API'
				},
				schemes: [req.get('X-Forwarded-Protocol') || protocol],
				basePath,
				host: req.headers.host,
				paths: {},
				securityDefinitions: opts.securityDefinitions,
				definitions: {},
				parameters: {},
				externalDocs: opts.externalDocs
			};

			resources.forEach(resource => {

				// add definitions
				_.each(resource.definitions, (resourceDefinition, defName) => {
					fullSwagger.definitions[defName] = resourceDefinition;
				});

				// TODO is this actually used, it is not part of the openAPI specification
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
		};
	};

	app.get(opts.discoveryUrl, makeHandler());

	// return app;
};

export const explorer = (app, opts) => {
	// add the swagger explorer page
	app.use('/explorer', express.static(swaggerUiAssetPath));

	// add the swagger api docs
	createApiDocs(app, opts);
};
