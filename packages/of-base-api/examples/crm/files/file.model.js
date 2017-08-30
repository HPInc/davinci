const mongooseModel = require('../../../src/mongoose.model');
const schema = require('./file.schema');

module.exports = mongooseModel('File', schema, 'files');
