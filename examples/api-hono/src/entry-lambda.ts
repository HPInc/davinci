import { handle } from 'hono/aws-lambda';
import { app, honoHttpServer } from './app';

app.init();

const hono = honoHttpServer.getInstance();

export const handler = handle(hono);
