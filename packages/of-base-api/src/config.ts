export default {
	PORT: process.env.PORT || 3000,
	PROTOCOL: (process.env.NODE_ENV === 'local' ? 'http' : 'https')
};
