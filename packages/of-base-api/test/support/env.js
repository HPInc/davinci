// Set up the environment needed for running the unit tests

process.env.NODE_ENV = 'unittest';
process.env.MONGODB_URL = 'mongodb://localhost/of-base-api-tests';

require('should');
require('mocha');
