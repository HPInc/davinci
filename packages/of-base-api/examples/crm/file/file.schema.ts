import { mgoose, swagger } from '../../../src';

@swagger.definition({ title: 'File' })
export default class File {
	@mgoose.prop()
	@swagger.prop()
	name: string;

	@mgoose.prop()
	@swagger.prop()
	accountId: string;

	@mgoose.prop()
	@mgoose.populate({ name: 'customer', opts: { ref: 'Customer', foreignField: '_id', justOne: true } })
	@swagger.prop()
	customerId: string;
}
