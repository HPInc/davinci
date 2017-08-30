const API = require('../../../src/API');
const def = require('./file.def');
const File = require('./file.model');

class FileAPI extends API {
	customFn(context) {
		return this.model.Model.find({ _id: "591eb951522d802685231039" });
	}
}

const controller = new FileAPI('file', def);

controller.contextFilter = context => ({ contextId: context.contextId });

controller.model = File;

module.exports = controller;
