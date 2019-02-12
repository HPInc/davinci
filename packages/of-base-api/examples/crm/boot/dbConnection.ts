const mongoose = require('mongoose');

module.exports = () => {
	mongoose.Promise = global.Promise;
	mongoose.set('debug', true);
	const mongodbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/customer-api';
	return mongoose.connect(mongodbUrl, { useNewUrlParser: true });
};
