const mongooseModel = require('../../../src/mongoose.model');
const schema = require('./customer.schema');

module.exports = mongooseModel('Customer', schema, 'customers');
