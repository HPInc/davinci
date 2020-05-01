/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import Debug from 'debug';
import _ from 'lodash';
import Resource from './Resource';

const debug = new Debug('of-base-api');

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

export const generateFullSwagger = opts => {
	const fullSwagger = _.merge({}, opts, {
		swagger: SWAGGER_VERSION,
		paths: {},
		definitions: {},
		parameters: {}
	});

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
