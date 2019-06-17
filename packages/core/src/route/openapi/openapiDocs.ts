import Debug from 'debug';
import express from 'express';
import _ from 'lodash';
import path from 'path';
import config from '../../config';
import Resource from './Resource';

const debug = Debug('of-base-api');

const swaggerUiAssetPath = path.resolve(path.join(__dirname, '../../explorer'));

const SWAGGER_VERSION = '2.0';

export const resources = [];

export const addResource = (resourceName, doc, basepath?) => {
	debug(`adding ${resourceName} resource`);
	// create the resource from the doc
	const resource = new Resource(resourceName, doc, basepath);
	// add it to the registry
	resources.push(resource);
};

export const sanitiseResourcePath = resourcePaths => {
	const EXCLUDED_PARAMETER_TYPES = ['res', 'req', 'context'];

	// remove non-standard parameters
	return _.mapValues(resourcePaths, path => {
		return {
			...path,
			parameters: _.filter(
				path.parameters,
				parameter => !EXCLUDED_PARAMETER_TYPES.includes(parameter.schema.type)
			)
		};
	});
};

export const generateFullSwagger = ({ protocol, basePath, host }, opts?) => {
	const options = opts || {};

	const fullSwagger = {
		swagger: SWAGGER_VERSION,
		info: {
			version: options.version || '1.0.0',
			title: options.title || 'API'
		},
		schemes: protocol,
		basePath,
		host,
		paths: {},
		securityDefinitions: null,
		definitions: {},
		parameters: {},
		externalDocs: null
	};

	if (options.securityDefinitions) {
		fullSwagger.securityDefinitions = options.securityDefinitions;
	}

	if (options.externalDocs) {
		fullSwagger.externalDocs = options.externalDocs;
	}

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
			const trimmedBasePath = _.trim(resource.basePath, '/');
			let fullPath = `/${trimmedBasePath}${pathName}`;
			if (pathName === '/') fullPath = `/${trimmedBasePath}`;
			fullSwagger.paths[fullPath] = sanitiseResourcePath(resourcePath);
		});
	});

	return fullSwagger;
};

export const createApiDocs = (app, opts?: any) => {
	const options = opts || {};
	debug(`setting up swagger docs on ${options.discoveryUrl}`);

	const makeHandler = () => {
		return (req, res) => {
			const protocol = req.get('X-Forwarded-Protocol') || options.protocol || config.PROTOCOL;
			const basePath = options.basePath;
			const host = req.headers.host;
			const fullSwagger = generateFullSwagger({ protocol, basePath, host }, opts);
			res.json(fullSwagger);
		};
	};

	app.get(options.discoveryUrl, makeHandler());

	// return app;
};

export const explorer = (app, opts) => {
	// add the swagger explorer page
	app.use('/explorer', express.static(swaggerUiAssetPath));

	// add the swagger api docs
	createApiDocs(app, opts);
};
