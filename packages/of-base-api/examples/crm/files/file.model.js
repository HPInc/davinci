const MongooseModel = require('../../../src/MongooseModel');
const schema = require('./file.schema');

module.exports = new MongooseModel('File', schema, 'files');
