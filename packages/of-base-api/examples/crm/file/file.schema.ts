import { mongooseProp, swaggerProp, swaggerDefinition } from '../../../src';

export interface IFile {
	_id: string;
	name: string;
	accountId: string;
}

@swaggerDefinition({ title: 'File' })
export default class File implements IFile {
	@mongooseProp()
	@swaggerProp()
	// @ts-ignore
	_id: string;

	@mongooseProp()
	@swaggerProp()
	name: string;

	@mongooseProp()
	@swaggerProp()
	accountId: string;
}
