const BaseController = require('../../../src/BaseController');
const definition = require('./customer.def');
const CustomerModel = require('./customer.model');
const FileModel = require('../files/file.model');

class CustomerController extends BaseController {
	// easy to test
	constructor({ model = CustomerModel.create(), def = definition } = {}) {
		super(def, model);
		this.fileModel = FileModel.create();
	}

	customMethod() {
		return this.fileModel.find({});
	}
}

module.exports = CustomerController;
