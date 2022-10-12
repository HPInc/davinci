/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import newrelic from 'newrelic';
import { Interceptor } from '@davinci/core';
import { AmqpInterceptorContext } from '@davinci/messaging-amqp';

export const newrelicInterceptor = (transactionName?: string): Interceptor<AmqpInterceptorContext> => {
	return function newrelicInterceptor(next, { context: { subscription } }) {
		const tName = transactionName ?? subscription.settings?.name;

		newrelic.startBackgroundTransaction(tName, async () => {
			const transaction = newrelic.getTransaction();
			try {
				return await next();
			} finally {
				transaction.end();
			}
		});
	};
};
