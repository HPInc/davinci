export default {
	MONGODB_URL: process.env.MONGODB_URL || 'mongodb://localhost/files-api',
	PORT: process.env.PORT || 3000,
	PROTOCOL: (process.env.NODE_ENV === 'local' ? 'http' : 'https')
};
