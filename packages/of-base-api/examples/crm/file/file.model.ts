import { model } from 'mongoose';
import { mgoose } from '../../../src/mongoose';
import FileSchema from './file.schema';

const schema = mgoose.generateSchema(FileSchema);

mgoose.beforeRead(schema, (mQuery, context) => {
	console.log(mQuery, context);
});

const File = model('File', schema, 'files');

export default File;
