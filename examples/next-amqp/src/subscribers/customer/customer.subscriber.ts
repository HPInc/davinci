/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import type { ChannelWrapper } from '@davinci/messaging-amqp';
import { channelParam, message, payload, subscribe } from '@davinci/messaging';
import { interceptor } from '@davinci/core';
import { newrelicInterceptor } from '../../interceptors/newrelic';
import { Customer } from './customer.schema';

export default class CustomerSubscriber {
	@subscribe({
		name: 'subscribeCustomerChange',
		amqp: {
			exchange: 'exchange1',
			topic: 'topic1',
			queue: 'queue1'
		}
	})
	@interceptor(newrelicInterceptor())
	subscribeCustomerChange(@message() msg, @payload() customer: Customer, @channelParam() channel: ChannelWrapper) {
		return { msg, customer, channel };
	}
}
