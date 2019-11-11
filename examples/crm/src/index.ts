import express, { Express } from 'express';
import { createApp, createRouter, IOfBaseExpress } from '@davinci/core';
import CustomerController from './customer/customer.controller';
import packageJson = require('../package.json');

const options = {
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
				securityDefinitions: { Bearer: { type: 'apiKey', name: 'Authorization', in: 'header' } }
			}
		},
		ui: {
			path: '/explorer'
		}
	}
};

const expressApp: Express = express();

const createContext = ({ req }) => ({ accountId: req.headers['x-oneflow-accountid'] });

createApp(expressApp, options, app => {
	app.use(createRouter(CustomerController, 'Customer', createContext));
});

if (require.main === module) {
	// this module was run directly from the command line as in node xxx.js
	(expressApp as IOfBaseExpress).start();
}

export default expressApp;
