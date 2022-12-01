/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import newrelic from 'newrelic';
import { AmqpInterceptor } from '@davinci/messaging-amqp';

export const newrelicInterceptor = (transactionName?: string): AmqpInterceptor => {
	return function newrelicInterceptor(next, { subscription }) {
		const tName = transactionName ?? subscription.settings?.name;

		return newrelic.startBackgroundTransaction(tName, async () => {
			const transaction = newrelic.getTransaction();
			try {
				return await next();
			} finally {
				transaction.end();
			}
		});
	};
};
