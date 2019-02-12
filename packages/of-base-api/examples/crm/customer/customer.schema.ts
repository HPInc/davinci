// import { Document, Model } from 'mongoose';
import { prop } from '../../../src/lib/mongoose.helpers';

// TODO - we need a better example than this

/*export interface ICustomer extends Model<Document> {
	firstname: string;
	lastname: string;
	weight: string;
}*/

// We are definiting document which will have all mongoose document methods mixed in, plus our customer Document methods
// export interface ICustomerDocument extends ICustomer, Document {}

// export interface ICustomerModel extends Model<ICustomerDocument> {}

export interface ICustomer {
	firstname: string;
	lastname: string;
	weight: number;
}

export default class Customer implements ICustomer {
	@prop({ required: true })
	firstname: string;

	@prop({ required: true })
	lastname: string;

	@prop()
	weight: number;
}
