/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { createApp } from '@davinci/core';
import { AmqpModule } from '@davinci/messaging-amqp';
import { CustomerSubscriber } from './subscribers/customer';

const app = createApp();

app.registerController(CustomerSubscriber).registerModule(
	new AmqpModule({
		connection: 'amqp://app:app@127.0.0.1:5672',
		defaultSubscriptionSettings: { autoNack: { enabled: true, requeue: true }, json: true }
	})
);

if (require.main === module) {
	app.init();
}

export default app;
