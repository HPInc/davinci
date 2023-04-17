/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { createApp } from '@davinci/core';
import { ExpressHttpServer } from '@davinci/http-server-express';
import { HealthChecksModule } from '@davinci/health-checks';
import { OpenAPIModule } from '@davinci/openapi';
import addErrors from 'ajv-errors';
import { ContextFactory, createAjvValidator } from '@davinci/http-server';
import { CustomerController } from './api/customer';
import { Context } from './types';
import { Request } from 'express';

export const app = createApp();
const contextFactory: ContextFactory<Context, Request> = ({ request }) => ({
	accountId: request.headers['x-accountid'] as string
});
app.registerController(CustomerController).registerModule(
	new ExpressHttpServer({
		contextFactory,
		validationFactory: createAjvValidator({
			ajvOptions: {
				header: { coerceTypes: true },
				query: { coerceTypes: true }
			},
			ajvPlugins: [[addErrors]]
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
			},
			output: {
				path: './openapi.json',
				stringifyOptions: {
					space: 2
				}
			}
		}
	})
);

if (require.main === module) {
	app.init();
}
