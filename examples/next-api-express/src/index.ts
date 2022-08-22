/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { createApp } from '@davinci/core';
import { ExpressHttpServer } from '@davinci/http-server-express';
import { HealthChecksModule } from '@davinci/health-checks';
import { CustomerController } from './api/customer';

const app = createApp();
const contextFactory = ({ request }) => ({ accountId: request.headers['x-accountid'] });

app.registerController([CustomerController]).registerModule(
	new ExpressHttpServer().setContextFactory(contextFactory),
	new HealthChecksModule({ healthChecks: [{ name: 'liveness', endpoint: '/.ah/live' }] })
);

app.init();

export default app;
