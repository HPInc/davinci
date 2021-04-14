/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import Debug from 'debug';
import _ from 'lodash';
import Resource from './Resource';

const debug = new Debug('davinci:openapi');

const SWAGGER_VERSION = '2.0';

export const resources = [];

export const addResource = (doc, resourceName?: string, basepath?: string) => {
	debug(`adding resource`, resourceName);
	// create the resource from the doc
	const resource = new Resource(doc, resourceName, basepath);
	// add it to the registry
	resources.push(resource);
};

export const sanitiseResource = resource => {
	return _.omit(resource, ['hidden']);
};

export const sanitiseResourcePath = resourcePaths => {
	const EXCLUDED_PARAMETER_TYPES = ['res', 'req', 'context'];

	return _.reduce(
		resourcePaths,
		(acc, pathConfig, method) => {
			// add the configuration only if !hidden
			if (!pathConfig.hidden) {
				acc[method] = {
					...pathConfig,
					// remove non-standard parameters
					parameters: _.filter(
						pathConfig.parameters,
						parameter => !EXCLUDED_PARAMETER_TYPES.includes(parameter.schema.type)
					).map(p => _.omit(p, ['_index']))
				};
			}
			return acc;
		},
		{}
	);
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
			if (!resourceDefinition.hidden) {
				fullSwagger.definitions[defName] = sanitiseResource(resourceDefinition);
			}
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
			const path = sanitiseResourcePath(resourcePath);
			if (!_.isEmpty(path)) {
				fullSwagger.paths[fullPath] = path;
			}
		});
	});

	return fullSwagger;
};
