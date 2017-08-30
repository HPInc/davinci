const _ = require('lodash');

function Resource(basePath, doc) {
	this.basePath = basePath;
	this.paths = doc.paths;
	this.definitions = doc.definitions;
	this.parameters = doc.parameters;

	_.each(this.paths, path => {
		_.each(path, operation => {

			if (!operation.consumes) operation.consumes = [];
			operation.consumes.push('application/json');

			if (!operation.produces) operation.produces = [];
			operation.produces.push('application/json');

			// tags
			if (!operation.tags) operation.tags = [];
			operation.tags.push(this.basePath);

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

module.exports = Resource;
