import { generateModel } from '../../../src/mongoose/mongoose.helpers';
import File from './file.schema';

const model = generateModel(File);

export default model;
