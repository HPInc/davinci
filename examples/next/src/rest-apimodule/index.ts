import { createApp, DaVinciOptions } from '@davinci/core';
import { ApiModule } from './ApiModule';

const options: DaVinciOptions = {
	healthChecks: {
		readinessEndpoint: '/.ah/ready',
		livenessEndpoint: '/.ah/live'
	}
};

const app = createApp(options).register(new ApiModule());

app.init();

export default app;
