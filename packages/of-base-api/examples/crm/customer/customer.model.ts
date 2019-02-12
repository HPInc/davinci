import { generateModel } from '../../../src/lib/mongoose.helpers';
import Customer from './customer.schema';

const model = generateModel(Customer);

export default model;
