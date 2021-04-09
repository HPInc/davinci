/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import _ from 'lodash';
import { ISwaggerDefinitions, PathsDefinition } from '../types';

class Resource {
	resourceName: string;

	paths: PathsDefinition;

	definitions: ISwaggerDefinitions;

	parameters: object;

	basePath: string;

	constructor(doc, resourceName, basePath?) {
		this.resourceName = resourceName;
		this.paths = doc.paths;
		this.definitions = doc.definitions;
		this.parameters = doc.parameters;
		this.basePath = basePath || this.resourceName;

		_.each(this.paths, path => {
			_.each(path, operation => {
				if (!operation.consumes || operation.consumes.length === 0) {
					operation.consumes = ['application/json'];
				}

				if (!operation.produces || operation.produces.length === 0) {
					operation.produces = ['application/json'];
				}

				// tags
				if (!operation.tags || operation.tags.length === 0) {
					operation.tags = [_.capitalize(this.resourceName)];
				}
				// operations
				if (!operation.responses) operation.responses = {};
			});
		});
	}
}

export default Resource;
