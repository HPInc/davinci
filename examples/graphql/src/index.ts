import express, { Express } from 'express';
import { createApp, DaVinciExpress, DaVinciOptions } from '@davinci/core';
import { createGraphQLServer } from '@davinci/graphql';
import { BookController, AuthorController } from './api';

const options: DaVinciOptions = {
	boot: {
		dirPath: './build/examples/crm/boot'
	},
	healthChecks: {
		readynessEndpoint: '/.ah/ready',
		livenessEndpoint: '/.ah/live'
	}
};

const expressApp: Express = express();

const context = ({ req }) => ({ accountId: req.headers['x-oneflow-accountid'] });

createApp(expressApp, options, app => {
	createGraphQLServer(app, [BookController, AuthorController], { context });
});

if (require.main === module) {
	// this module was run directly from the command line as in node xxx.js
	(expressApp as DaVinciExpress).start();
}

export default expressApp;
