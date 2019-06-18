import express, { Express } from 'express';
import { createApp, createRouter, IOfBaseExpress } from '@oneflow/substrate-core';
import CustomerController from './customer/customer.controller';
import packageJson = require('../package.json');

const options = {
	version: packageJson.version,
	boot: {
		dirPath: './build/examples/crm/boot'
	},
	healthChecks: {
		readynessEndpoint: '/.ah/ready',
		livenessEndpoint: '/.ah/live'
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
