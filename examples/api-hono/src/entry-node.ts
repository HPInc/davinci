import { serve } from '@hono/node-server';
import { app, honoHttpServer } from './app';

app.init();

serve(honoHttpServer.getInstance(), info => {
	console.log(`Node.js server listening at port: ${info.address}:${info.port}`);
});
