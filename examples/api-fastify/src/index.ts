/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { createApp } from '@davinci/core';
import { FastifyHttpServer } from '@davinci/http-server-fastify';
import { HealthChecksModule } from '@davinci/health-checks';
import { OpenAPIModule } from '@davinci/openapi';
import addErrors from 'ajv-errors';
import { createAjvValidator } from '@davinci/http-server';
import { CustomerController } from './api/customer';

const app = createApp();
const contextFactory = ({ request }) => ({ accountId: request.headers['x-accountid'] });

app.registerController(CustomerController).registerModule(
	new FastifyHttpServer({
		contextFactory,
		validationFactory: createAjvValidator({
			ajvOptions: { strict: true, coerceTypes: false },
			ajvPlugins: {
				body: [[addErrors]]
			}
		})
	}),
	new HealthChecksModule({ healthChecks: [{ name: 'liveness', endpoint: '/.ah/live' }] }),
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
