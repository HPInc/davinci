import 'reflect-metadata';
export * from './context';
import { createApp } from './createApp';
import { IOfBaseExpress } from './types';

/**
 * This is only here to assist people when upgrading their API.
 * It will be removed in a future version.
 */
const boot = () => {
	/* eslint-disable no-console */
	console.error('ERROR: boot() is deprecated, please use createApp() instead.');
	process.exit(-1);
};

export { boot, createApp, IOfBaseExpress };
