/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { createApp } from '@davinci/core';
import { HonoHttpServer } from '@davinci/http-server-hono';
import { Context as HonoContext } from 'hono';
import { OpenAPIModule } from '@davinci/openapi';
import addErrors from 'ajv-errors';
import { ContextFactory, createAjvValidator } from '@davinci/http-server';
import { CustomerController } from './api/customer';
import { Context } from './types';

export const app = createApp();
const contextFactory: ContextFactory<Context, HonoContext> = ({ request }) => ({
	accountId: request.req.header('x-accountid') as string
});

export const honoHttpServer = new HonoHttpServer({
	contextFactory,
	validationFactory: createAjvValidator({
		ajvOptions: { strict: true, coerceTypes: false },
		ajvPlugins: {
			body: [[addErrors]]
		}
	})
});

const openApiModule = new OpenAPIModule({
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
});

app.registerController(CustomerController).registerModule(honoHttpServer, openApiModule);
