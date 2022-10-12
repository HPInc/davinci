/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import type { ChannelWrapper } from '@davinci/messaging-amqp';
import { ChannelParam, Message, Payload, Subscribe } from '@davinci/messaging-amqp';
import { interceptor } from '@davinci/core';
import { newrelicInterceptor } from '../../interceptors/newrelic';
import { Customer } from './customer.schema';

export default class CustomerSubscriber {
	@Subscribe({
		name: 'subscribeCustomerChange',
		exchange: 'exchange1',
		topic: 'topic1',
		queue: 'queue1'
	})
	@interceptor(newrelicInterceptor())
	subscribeCustomerChange(@Message() msg, @Payload() payload: Customer, @ChannelParam() channel: ChannelWrapper) {
		return { msg, payload, channel };
	}
}
