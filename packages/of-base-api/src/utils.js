const Errors = require('./errors');
const crypto = require('crypto');

exports.throwIfNotFound = result => {
	if (!result) {
		throw new Errors.NotFound();
	}
	return result;
};

exports.md5 = payload => {
	const hash = crypto.createHash('md5');
	hash.update(payload);
	return hash.digest('hex');
};

exports.escapeRegex = value => {
	if (!value) return;
	return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

exports.testUrl = string => {
	const testUrl = /^((http|ftp)s?:\/\/)/;
	return testUrl.test(string);
};

exports.generateUid = separator => {
	const delim = separator || '-';

	function S4() {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	}

	return (S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4());
};
