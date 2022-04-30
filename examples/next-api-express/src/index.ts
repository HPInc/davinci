import { createApp } from '@davinci/core';
import { ExpressHttpServer } from '@davinci/http-server-express';
import { CustomerController } from './api/customer';

const app = createApp();
const contextFactory = ({ request }) => request.headers;

app.registerController([CustomerController])
	.registerModule(new ExpressHttpServer().setContextFactory(contextFactory))
	.init();

export default app;
