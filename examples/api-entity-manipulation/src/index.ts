/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { createApp } from '@davinci/core';
import { FastifyHttpServer } from '@davinci/http-server-fastify';
import { MongooseModule } from '@davinci/mongoose';
import { createAjvValidator } from '@davinci/http-server';
import { OpenAPIModule } from '@davinci/openapi';
import { CustomerController } from './api/customer';

const app = createApp();
const contextFactory = ({ request }) => ({ accountId: request.headers['x-accountid'] });

app.registerController(CustomerController).registerModule(
	new MongooseModule({ connection: { uri: 'mongodb://127.0.0.1:27017/example' } }),
	new FastifyHttpServer({
		contextFactory,
		validationFactory: createAjvValidator({
			ajvOptions: {
				allErrors: true,
				removeAdditional: 'all',
				coerceTypes: 'array'
			}
		})
	}),
	new OpenAPIModule({
		document: {
			spec: {
				info: { version: '1.0.0', title: 'Customer API', description: 'My nice Customer API' },
				components: {
					securitySchemes: {
						bearerAuth: {
							type: 'http',
							scheme: 'bearer',
							bearerFormat: 'JWT'
						}
					}
				},
				security: [
					{
						bearerAuth: []
					}
				]
			}
		}
	})
);

if (require.main === module) {
	app.init();
}

export default app;
