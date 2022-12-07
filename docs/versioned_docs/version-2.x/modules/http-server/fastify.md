# Fastify

Fastify is a fast and low overhead web framework, for Node.js

How to install it:

```bash
npm i --save @davinci/http-server-fastify @davinci/http-server ajv ajv-formats fastify @fastify/cors @fastify/static qs
```

After that, register the FastifyHttpServer module within the App

```diff
import { createApp } from '@davinci/core';
+import { FastifyHttpServer } from '@davinci/http-server-fastify';

const app = createApp();

app.registerModule(
+	new FastifyHttpServer()
);

if (require.main === module) {
	app.init();
}

export default app;

```

After that, you can write your first [controller](controllers)
