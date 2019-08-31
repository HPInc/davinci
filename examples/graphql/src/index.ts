console.time('whole thing');
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

console.time('create express');
const expressApp: Express = express();
console.timeEnd('create express');

const context = ({ req }) => ({ accountId: req.headers['x-oneflow-accountid'] });

console.time('createApp');
createApp(expressApp, options, app => {
	console.timeEnd('createApp');
	console.time('createApolloServer');
	createApolloServer(app, { controllers: [AuthorController, BookController], context });
	console.timeEnd('createApolloServer');
});

if (require.main === module) {
	// this module was run directly from the command line as in node xxx.js
	(async () => {
		console.time('start app');
		await (expressApp as IOfBaseExpress).start();
		console.timeEnd('start app');
		console.timeEnd('whole thing');
	})()
}

export default expressApp;
