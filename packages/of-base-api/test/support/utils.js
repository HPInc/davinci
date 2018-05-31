module.exports.makeMockResponse = done => {
	const logDone = (...args) => {
		done(...args);
	};
	const request = {
		status: () => request,
		send: logDone,
		json: logDone,
		end: logDone
	};
	return request;
};

module.exports.makeMockRequest = (method, url, body = {}) => {
	return { url, method, body };
};

module.exports.makeMockControllerClass = (model, classToExtend) => {
	return class extends classToExtend {
		constructor() {
			super({ model });
		}
	};
};

module.exports.makeContext = (accountId = '') => {
	return {
		accountId,
		body: {},
		params: {},
		query: {},
		req: {},
		res: {}
	};
};
