import { createApp, DaVinciOptions } from '@davinci/core';
import { SqsModule } from './SqsModule';

const options: DaVinciOptions = {
	healthChecks: {
		readinessEndpoint: '/.ah/ready',
		livenessEndpoint: '/.ah/live'
	}
};

const app = createApp(options).register(new SqsModule());

app.init();

export default app;
