import express, { Express } from 'express';
import { createApp, DaVinciExpress } from '@davinci/core';
import { createGraphQLServer } from '@davinci/graphql';
import AuthorController from './author/author.controller';
import BookController from './book/book.controller';

const options = {
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
	createGraphQLServer(app, [AuthorController, BookController], { context });
});

if (require.main === module) {
	// this module was run directly from the command line as in node xxx.js
	(expressApp as DaVinciExpress).start();
}

export default expressApp;
