import { createApp, DaVinciOptions } from '@davinci/core';
import { ExpressHttpModule } from '@davinci/http-express';
import { CustomerController } from './api/customer';

const options: DaVinciOptions = {
	healthChecks: {
		readinessEndpoint: '/.ah/ready',
		livenessEndpoint: '/.ah/live'
	}
};

const app = createApp(options).register(
	new ExpressHttpModule({
		controllers: [CustomerController]
	})
);

app.init();

export default app;
