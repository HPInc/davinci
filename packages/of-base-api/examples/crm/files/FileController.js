const BaseController = require('../../../src/BaseController');
const definition = require('./file.def');
const FileModel = require('./file.model');

class FileController extends BaseController {
	constructor({ model = FileModel.create(), def = definition } = {}) {
		super(def, model);
	}

	customFn() {
		return this.model.Model.find({ _id: '591eb951522d802685231039' });
	}
}

module.exports = FileController;
