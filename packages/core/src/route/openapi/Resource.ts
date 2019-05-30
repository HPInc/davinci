import _ from 'lodash';
import { ISwaggerDefinitions, PathsDefinition } from '../types/openapi';

class Resource {
	basePath: string;
	paths: PathsDefinition;
	definitions: ISwaggerDefinitions;
	parameters: object;
	constructor(basePath, doc) {
		this.basePath = basePath;
		this.paths = doc.paths;
		this.definitions = doc.definitions;
		this.parameters = doc.parameters;

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
					operation.tags = [_.capitalize(this.basePath)];
				}
				// operations
				if (!operation.responses) operation.responses = {};
				if (!operation.responses['200'] && !operation.responses[200]) {
					operation.responses['200'] = {
						description: `List of ${basePath} results`
					};
				}
			});
		});
	}
}

export default Resource;
