/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { createApp } from '@davinci/core';
import { FastifyHttpServer } from '@davinci/http-server-fastify';
import { MongooseModule } from '@davinci/mongoose';
import { CustomerController } from './api/customer';
import { createAjvValidator } from '@davinci/http-server';

const app = createApp();
const contextFactory = ({ request }) => ({ accountId: request.headers['x-accountid'] });

app.registerController(CustomerController).registerModule(
	new MongooseModule({ connection: { uri: 'mongodb://127.0.0.1:27017/example' } }),
	new FastifyHttpServer({
		contextFactory,
		validationFactory: createAjvValidator({ ajvOptions: { removeAdditional: false } })
	})
);

if (require.main === module) {
	app.init();
}

export default app;
