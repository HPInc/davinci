const mongoose = require('mongoose');

module.exports = async app => {
	mongoose.Promise = global.Promise;
	const mongodbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/customer-api';
	await mongoose.connect(
		mongodbUrl,
		{ useNewUrlParser: true }
	);

	/*
	ready states being:
	0: disconnected
	1: connected
	2: connecting
	3: disconnecting
	*/

	app.registerReadynessCheck(() => {
		if (mongoose.connection.readyState !== 1) {
			throw new Error('Mongodb connection is in a bad status');
		}
	});

	app.registerLivenessCheck(() => {
		if (mongoose.connection.readyState !== 1) {
			throw new Error('Mongodb still not connected');
		}
	});

	app.registerOnSignalJob(() => {
		console.log('closing mongodb connection');
		return mongoose.connection.close();
	});
};
