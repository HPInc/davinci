# Hono

[Hono](https://hono.dev/) is a small, simple, and ultrafast web framework for the Edges. It works on any JavaScript runtime: Cloudflare Workers, Fastly Compute@Edge, Deno, Bun, Vercel, Netlify, Lagon, AWS Lambda, Lambda@Edge, and Node.js.

How to install it:

```bash
npm i --save @davinci/http-server-hono @davinci/http-server ajv ajv-formats qs
```

After that, register the HonoHttpServer module within the App

```diff
import { createApp } from '@davinci/core';
+import { HonoHttpServer } from '@davinci/http-server-fastify';

const app = createApp();

app.registerModule(
+	new HonoHttpServer()
);

if (require.main === module) {
	app.init();
}

export default app;

```

Please have a look at the [examples](https://github.com/HPInc/davinci/blob/a1c565ff28c2a999cc76da218af4c5069f9b3340/examples/api-hono) 
on how to use it in different environments



Once configured, you can write your first [controller](controllers)
