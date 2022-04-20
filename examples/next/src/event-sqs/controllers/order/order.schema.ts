import { Schema } from 'mongoose';
import { mgoose } from '@davinci/mongoose';

@mgoose.index({ status: 1 })
export default class Order {
	_id: Schema.Types.ObjectId;

	@mgoose.prop({ required: true })
	status: string;

	@mgoose.prop({ type: Schema.Types.ObjectId })
	accountId: string;
}
