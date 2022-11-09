# Express

Express is the most popular web framework for Node.js

How to install it:

```bash
npm i --save @davinci/http-server-express @davinci/http-server ajv ajv-formats express
```

After that, register the ExpressHttpServer module within the App

```diff
import { createApp } from '@davinci/core';
+import { ExpressHttpServer } from '@davinci/http-server-express';

const app = createApp();

app.registerModule(
+	new ExpressHttpServer()
);

if (require.main === module) {
	app.init();
}

export default app;

```

After that, you can write your first [controller](controllers)
