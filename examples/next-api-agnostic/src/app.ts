/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { createApp } from '@davinci/core';
import { AgnosticRouterModule } from '@davinci/http-agnostic-router';
import { HealthChecksModule } from '@davinci/health-checks';
import { OpenAPIModule } from '@davinci/openapi';
import { CustomerController } from './api/customer';

export const app = createApp();
const contextFactory = ({ request }) => ({ accountId: request.headers['x-accountid'] });

app.registerController(CustomerController).registerModule(
	new AgnosticRouterModule({ contextFactory }),
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