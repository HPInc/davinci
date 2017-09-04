const BaseController = require('../../../src/BaseController');
const definition = require('./customer.def');
const CustomerModel = require('./customer.model');
const FileModel = require('../files/file.model');

class CustomerController extends BaseController {
	// easy to test
	constructor({ model = CustomerModel, def = definition } = {}) {
		super();
		this.model = model;
		this.def = def;
	}

	customMethod() {
		return FileModel.find({});
	}
}

module.exports = CustomerController;
