const mongoose = require('mongoose');

module.exports = () => {
	mongoose.Promise = global.Promise;
	mongoose.set('debug', true);
	return mongoose.connect('mongodb://localhost/files-api', { useMongoClient: true });
};
