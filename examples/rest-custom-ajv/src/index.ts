import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import express, { Express } from 'express';
import { createApp, createRouter, DaVinciExpress, DaVinciOptions } from '@davinci/core';
import { CustomerController } from './api/customer';
import packageJson from '../package.json';
import { Context } from './types';

const options: DaVinciOptions = {
	version: packageJson.version,
	boot: {
		dirPath: './build/src/boot'
	},
	healthChecks: {
		readynessEndpoint: '/.ah/ready',
		livenessEndpoint: '/.ah/live'
	},
	openapi: {
		docs: {
			path: '/api-doc.json',
			options: {
				info: {
					name: 'CRM',
					version: packageJson.version
				},
				securityDefinitions: { Bearer: { type: 'apiKey', name: 'Authorization', in: 'header' } },
				security: [
					{
						Bearer: []
					}
				]
			}
		},
		ui: {
			path: '/explorer'
		}
	}
};

const expressApp: Express = express();

const contextFactory = ({ req }): Context => ({ accountId: req.headers['x-custom-accountid'] });

const ajvFactory = ({ parameter }) => {
	const coerceTypesIn: string[] = ['header', 'query'];
	const ajv = new Ajv({
		allErrors: true,
		coerceTypes: coerceTypesIn.includes(parameter.in),
		useDefaults: true,
		removeAdditional: 'all'
	});
	addErrors(ajv);
	addFormats(ajv);
	return ajv;
};

createApp(expressApp, options, app => {
	createRouter({
		Controller: CustomerController,
		contextFactory,
		ajvFactory,
		router: app
	});
});

if (require.main === module) {
	// this module was run directly from the command line as in node xxx.js
	(expressApp as DaVinciExpress).start();
}

export default expressApp;
