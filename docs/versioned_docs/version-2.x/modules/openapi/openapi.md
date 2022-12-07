# OpenAPI

The OpenAPI module allows to expose an OpenAPI definition document and a Swagger UI.

## Installation

```bash
npm i --save @davinci/openapi
```

## Register the module

```diff
import { createApp } from '@davinci/core';
import { ExpressHttpServer } from '@davinci/http-server-express';
+import { OpenAPIModule } from '@davinci/openapi';

const app = createApp();

app.registerModule(
	new ExpressHttpServer(),
+	new OpenAPIModule({
+		explorer: {
+			path: '/explorer'
+		},
+		document: {
+			path: '/openapi',
+			spec: {
+				info: { version: '1.0.0', title: 'Customer API', description: 'My nice Customer API' }
+			}
+		}
+	})
);

if (require.main === module) {
	app.init();
}

export default app;

```
