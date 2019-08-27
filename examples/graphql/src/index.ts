import 'reflect-metadata';
import express, { Express } from 'express';
import { createApp, IOfBaseExpress } from '@davinci/core';
import { createApolloServer } from '@davinci/graphql';
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
	createApolloServer(app, { controllers: [AuthorController, BookController], context });
});

if (require.main === module) {
	// this module was run directly from the command line as in node xxx.js
	(expressApp as IOfBaseExpress).start();
}

export default expressApp;
