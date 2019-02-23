import { mongooseProp, swagger } from '../../../src';

export interface IFile {
	_id: string;
	name: string;
	accountId: string;
}

@swagger.definition({ title: 'File' })
export default class File implements IFile {
	@mongooseProp()
	@swagger.prop()
	// @ts-ignore
	_id: string;

	@mongooseProp()
	@swagger.prop()
	name: string;

	@mongooseProp()
	@swagger.prop()
	accountId: string;
}
