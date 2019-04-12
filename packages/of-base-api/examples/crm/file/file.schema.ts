import { mgoose, swagger } from '../../../src';

@swagger.definition({ title: 'File' })
export default class File {
	@mgoose.prop()
	@swagger.prop()
	name: string;

	@mgoose.prop()
	@swagger.prop()
	accountId: string;
}
