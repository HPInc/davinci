import { createApp } from '@davinci/core';
import { ExpressHttpServer } from '@davinci/http-server-express';
import { CustomerController } from './api/customer';

const app = createApp();
app.registerController([CustomerController]);
app.registerModule(new ExpressHttpServer());

app.init();

export default app;
