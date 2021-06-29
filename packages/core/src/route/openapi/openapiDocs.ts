/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import Debug from 'debug';
import _ from 'lodash';
import { OpenAPIV3 } from 'openapi-types';
import Resource from './Resource';

const debug = new Debug('davinci:openapi');

const OPENAPI_VERSION = '3.0.3';

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

export const generateOpenAPIv3 = (opts: Partial<OpenAPIV3.Document>): OpenAPIV3.Document => {
	const fullDoc: OpenAPIV3.Document = _.defaults({}, opts, {
		openapi: OPENAPI_VERSION,
		info: { title: 'unnamed', version: '1.0.0' },
		components: { schemas: {} },
		paths: {}
	});

	resources.forEach(resource => {
		// add schemas
		_.each(resource.definitions, (resourceDefinition, defName) => {
			if (!resourceDefinition.hidden) {
				fullDoc.components.schemas[defName] = sanitiseResource(resourceDefinition);
			}
		});

		// add paths
		_.each(resource.paths, (resourcePath, pathName) => {
			const trimmedBasePath = _.trim(resource.basePath, '/');
			let fullPath = `/${trimmedBasePath}${pathName}`;
			if (pathName === '/') fullPath = `/${trimmedBasePath}`;
			const path = sanitiseResourcePath(resourcePath);
			if (!_.isEmpty(path)) {
				fullDoc.paths[fullPath] = path;
			}
		});
	});

	return fullDoc;
};
