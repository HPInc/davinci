import { route } from '../../src';

export const makeMockResponse = done => {
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

export const makeMockRequest = (method, url, body = {}) => {
	return { url, method, body };
};

export const makeMockControllerClass = (model, classToExtend) => {
	const TheClass = class extends classToExtend {
		constructor() {
			super(model);
		}
	};

	route.controller()(TheClass);

	return TheClass;
};

export const makeContext = (accountId = '') => {
	return {
		accountId,
		body: {},
		params: {},
		query: {},
		req: {},
		res: {}
	};
};
