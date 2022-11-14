# Migration from V1

The following guide is a starting point for developers that want to migrate and old DaVinci V1 app, into the new V2.  
Few steps are required as some breaking changes have been introduced.

## Rewrite App initialization code

The App initialization code has undergone radical changes.  
The monolithic initialization and configuration of DaVinci V1 has been removed
in favour of a more modular, configurable approach.  
All the functionalities have been taken out from the 'core' package, into more
dedicated and specialized packages (e.g. http-server, http-server-fastify, openapi, health-checks)

### Before (V1)

```ts
import { createApp, createRouter, DaVinciExpress } from '@davinci/core';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import packageJson from '../package.json';
import DashboardController from './api/dashboard/DashboardController';
import config from './config';
import aclCheck from './middlewares/aclCheck';
import createContext from './lib/createContext';

const expressApp = express();
const bootOptions = {
	version: packageJson.version,
	boot: {
		dirPath: './build/src/boot'
	},
	healthChecks: {
		readynessEndpoint: '/.ah/ready',
		livenessEndpoint: '/.ah/live'
	}
};

createApp(expressApp, bootOptions, (app: any) => {
	if (config.env === 'local') {
		app.use(
			cors({
				credentials: true,
				origin: true
			})
		);
	}
	app.use(aclCheck);
	app.use(createRouter(DashboardController, null, createContext));
});

if (require.main === module) {
	// this module was run directly from the command line as in node xxx.js
	(expressApp as DaVinciExpress).start();
}

export default expressApp;
```

### After (V2)

```ts
import { createApp } from '@davinci/core';
import { FastifyHttpServer } from '@davinci/http-server-fastify';
import { MongooseModule } from '@davinci/mongoose';
import { HealthChecksModule } from '@davinci/health-checks';
import { OpenAPIModule } from '@davinci/openapi';
import DashboardController from './api/dashboard/DashboardController';
import packageJson from '../package.json';
import config from './config';
import { createContext } from './lib/createContext';
import { AuthModule } from './auth/AuthModule';

const app = createApp();

app.registerController([DashboardController]).registerModule(
	new FastifyHttpServer({
		port: 8080,
		contextFactory: createContext,
		middlewares: {
			cors: {
				...(config.env === 'local' ? { credentials: true, origin: true } : {})
			}
		}
	}),

	// the MongoDB initialization and connection is now handled by the mongoose module.
	// In V1 a boot script was required
	new MongooseModule({
		connection: { uri: config.mongodb }
	}),

	// the health checks endpoints configuration is now handled by the dedicated and separate module
	new HealthChecksModule({
		healthChecks: [
			{ name: 'liveness', endpoint: '/.ah/live' },
			{ name: 'readiness', endpoint: '/.ah/ready' }
		]
	}),

	// the OpenAPI configuration is now handled by the dedicated and separate module
	new OpenAPIModule({
		document: {
			spec: {
				info: { version: packageJson.version, title: 'Dashboard API' },
				components: {
					securitySchemes: {
						bearerAuth: {
							type: 'http',
							scheme: 'bearer',
							bearerFormat: 'JWT'
						}
					}
				},
				security: [
					{
						bearerAuth: []
					}
				]
			}
		}
	}),

	// All the V1 boot scripts, must be rewritten as Modules and registered here.
	new AuthModule()
);

if (require.main === module) {
	app.init();
}

export default app;
```

## Replace legacy decorators

The openapi decorators have been removed in favour of a more generic entity ones.  
Specifically

```diff
-import { openapi } from '@davinci/core';
+import { entity } from '@davinci/core';


-@openapi.definition({ title: 'Dashboard' })
+@entity({ name: 'Dashboard' })
export default class DashboardSchema {
-	@openapi.prop({ required: true })
+	@entity.prop({ required: true })
	name: string;

-	@openapi.prop()
+	@entity.prop()
	accountId: string;

-	@openapi.prop()
+	@entity.prop()
	userId: string;

-	@openapi.prop()
+	@entity.prop()
	theme: string;
}
```

## Moved route and httpErrors to `http-server`

As DaVinci is now a generic App container, all the functionalities specific to web servers
have been moved inside the `http-server` package.

### Before (V1)

```ts
import { context, route, httpErrors, openapi } from '@davinci/core';
```

### After (V2)

```ts
import { context, entity } from '@davinci/core';
import { httpErrors, route } from '@davinci/http-server';
```

## Rewrite boot scripts as Modules

The new DaVinci V2 is implemented around the concept of modules, typescript classes where specific
functionalities are implemented.
Modules also integrates some app lifecycle hooks `onRegister`, `onInit` and `onDestroy`.
Those hooks will be used to rewrite the legacy boot scripts present in V1, into Modules.

### Before (V1)

```ts
// src/boot/initAuthSubscriber.js
import AuthApiService from '../auth/AuthSubscriber';
import config from '../config';

const { sqsConfig } = config;

module.exports = async () => {
	const credentials = sqsConfig.aws.credentials;
	if (!credentials.accessKeyId || !credentials.secretAccessKey) {
		return console.warn('Missing aws credentials, AuthEventSubscriber not started');
	}
	const authEventsSubscriber = new AuthApiService(sqsConfig);
	await authEventsSubscriber.listen();

	app.registerOnSignalJob(() => {
		// do cleanup if necessary
	});
};
```

### After (V1)

```ts
// src/auth/AuthModule.js
import { App, Module } from '@davinci/core';
import AuthApiService from '../auth/AuthSubscriber';
import config from '../config';

const { sqsConfig } = config;

export class AuthModule extends Module {
	logger: App['logger'];

	getModuleId() {
		return 'auth';
	}

	onRegister(app: App) {
		this.logger = app.logger.child({ name: 'AuthModule' });
	}

	onInit(): unknown | Promise<unknown> {
		const credentials = sqsConfig.aws.credentials;
		if (!credentials.accessKeyId || !credentials.secretAccessKey) {
			return this.logger.warn('Missing aws credentials, AuthEventSubscriber not started');
		}
		const authEventsSubscriber = new AuthApiService(sqsConfig);
		return authEventsSubscriber.listen();
	}

	onDestroy() {
		// do cleanup if necessary
	}
}
```

## Rewrite express middlewares as Interceptors

The V2 of DaVinci implements an internal interceptors' system, that is capable to hook into the request lifecycle
to augment or even replace the standard request flow.

### Before (V!)

```ts
import { httpErrors } from '@davinci/core';

export default function aclCheck(req, _res, next) {
	const context = req.context;
	const accountId = context.accountId;

	const grantedRoles = ['admin', 'service'];
	const isRoleAdmin = context.aclGroups.find(g => grantedRoles.includes(g));
	const isUserAllowed = context.ofAuth || context.userAccounts.includes(accountId);

	if (!isRoleAdmin && !isUserAllowed) {
		return next(new httpErrors.NotAuthenticated('Unauthorized'));
	}

	return next();
}
```

### After (V2)

```ts
import { httpErrors, HttpServerInterceptor } from '@davinci/http-server';
import { FastifyRequest } from 'fastify';
import { Context } from '../types';

export const aclCheck: HttpServerInterceptor<{ Context: Context }, FastifyRequest> = (next, { context }) => {
	const accountId = context.accountId;

	const grantedRoles = ['admin', 'service'];
	const isRoleAdmin = context.aclGroups.find(g => grantedRoles.includes(g));
	const isUserAllowed = context.ofAuth || context.userAccounts.includes(accountId);

	if (!isRoleAdmin && !isUserAllowed) {
		throw new httpErrors.NotAuthenticated('Unauthorized');
	}

	// remember to always return the next function call
	return next();
};
```
