import * as errors from './src/errors';
import BaseController from './src/BaseController';
import { createApp } from './src/createApp';
import createRouter from './src/rest/createRouter';

/**
 * This is only here to assist people when upgrading their API.
 * It will be removed in a future version.
 */
const boot = () => {
	/* eslint-disable no-console */
	console.error('ERROR: boot() is deprecated, please use createApp() instead.');
	process.exit(-1);
};

export {
	BaseController,
	boot,
	createApp,
	createRouter,
	errors
};
