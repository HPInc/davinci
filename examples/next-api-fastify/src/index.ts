/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { createApp } from '@davinci/core';
import { FastifyHttpServer } from '@davinci/http-server-fastify';
import { HealthChecksModule } from '@davinci/health-checks';
import { CustomerController } from './api/customer';

const app = createApp();
const contextFactory = ({ request }) => ({ accountId: request.headers['x-accountid'] });

app.registerController([CustomerController])
	.registerModule(new FastifyHttpServer().setContextFactory(contextFactory))
	.registerModule(new HealthChecksModule({ healthChecks: [{ name: 'liveness', endpoint: '/.ah/live' }] }))
	.init();

export default app;
