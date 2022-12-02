# Health Checks

The Health Checks module provides integration with Terminus, allowing to register health indicators within your app.

## Installation

```bash
npm i --save @davinci/health-checks @godaddy/terminus
```

## Register the module

```diff
import { createApp } from '@davinci/core';
import { ExpressHttpServer } from '@davinci/http-server-express';
+import { OpenAPIModule } from '@davinci/health-checks';

const app = createApp();

app.registerModule(
	new ExpressHttpServer(),
+	new HealthChecksModule({
+		healthChecks: [
+			{ name: 'liveness', endpoint: '/.ah/live' },
+			{ name: 'readiness', endpoint: '/.ah/ready' }
+		]
+	}),
);

if (require.main === module) {
	app.init();
}

export default app;

```

## Register a new health check

Health check hooks are registered via the `healthCheck()` decorator, that can be applied both to Modules and Controller methods.

```typescript
import { route } from '@davinci/http-server';
import { Customer } from './customer.schema';
import { healthCheck } from '@davinci/health-checks';

@route.controller({
	basePath: '/api/customers'
})
export default class CustomerController {
	[...]

	@healthCheck('readiness')
	@healthCheck('liveness')
	checkMongo() {
		if(mongoose.connection.readyState !== 1) {
            throw new Error('Mongodb client not connected')
		}
        
		return { mongooseConnected: true };
	}
}
```
