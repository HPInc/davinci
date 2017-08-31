const mongooseModel = require('../../../src/mongooseModel');
const schema = require('./file.schema');

module.exports = mongooseModel('File', schema, 'files');
