/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { createApp } from '@davinci/core';
import { ExpressHttpServer } from '@davinci/http-server-express';
import { CustomerController } from './api/customer';

const app = createApp();
const contextFactory = ({ request }) => ({ accountId: request.headers['x-accountid'] });

app.registerController([CustomerController]).registerModule(new ExpressHttpServer().setContextFactory(contextFactory));
app.init();

export default app;
