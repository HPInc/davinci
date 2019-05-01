import { BaseController, route } from '../../../src';
import model from './file.model';
import FileSchema from './file.schema';

@route.controller({ basepath: '/api/files', resourceSchema: FileSchema })
class FileController extends BaseController {
	constructor() {
		super(model);
	}

	customFn() {
		return this.model.find({ _id: '591eb951522d802685231039' });
	}
}

export default FileController;
