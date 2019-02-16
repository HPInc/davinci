import { BaseController } from '../../../src';
import model from './file.model';
import FileSchema from './file.schema';
import { controller } from "../../../src/rest/swagger";

@controller({ basepath: '/files' })
class FileController extends BaseController {
	constructor() {
		super(model, FileSchema);
	}

	customFn() {
		return this.model.Model.find({ _id: '591eb951522d802685231039' });
	}
}

export default FileController;
