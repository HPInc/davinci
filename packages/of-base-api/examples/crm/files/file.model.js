const MongooseModel = require('../../../src/MongooseModel');
const schema = require('./file.schema');

const create = () => {
	return new MongooseModel('File', schema, 'files');
};

module.exports = { create };
