export { default as BaseController } from './BaseController';
export * from './mongoose';
export * from './rest';
export * from './context';
import * as errors from './errors';
import { createApp } from './createApp';
import createRouter from './rest/createRouter';

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
	boot,
	createApp,
	createRouter,
	errors
};
