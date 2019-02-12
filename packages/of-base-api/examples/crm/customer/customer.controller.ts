import BaseController from '../../../src/BaseController';
import definition from './customer.def';
import CustomerModel from './customer.model';
// import FileModel from '../files/file.model';

export default class CustomerController extends BaseController {
	// easy to test
	constructor({ model = CustomerModel, def = definition } = {}) {
		super(def, model);
		// this.fileModel = FileModel.create();
	}

	customMethod() {
		// return this.fileModel.find({});
	}
}
