const BaseController = require('../../../src/BaseController');
const definition = require('./file.def');
const File = require('./file.model');

class FileController extends BaseController {
	constructor({ model = File, def = definition } = {}) {
		super();
		this.model = model;
		this.def = def;
	}

	customFn(context) {
		return this.model.Model.find({ _id: "591eb951522d802685231039" });
	}
}

module.exports = FileController;
