/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import type { ChannelWrapper } from '@davinci/messaging-amqp';
import { ChannelManager } from '@davinci/messaging-amqp';
import { channelParam, message, payload, subscribe } from '@davinci/messaging';
import { di, interceptor } from '@davinci/core';
import { newrelicInterceptor } from '../../interceptors/newrelic';
import { Customer } from './customer.schema';

// the injectable decorator is required to inject the dependencies
// listed in the constructor
@di.injectable()
export default class CustomerSubscriber {
	constructor(private channelManager?: ChannelManager) {}

	@subscribe({
		name: 'subscribeCustomerChange',
		amqp: {
			exchange: 'exchange1',
			topic: 'topic1',
			queue: 'queue1'
		}
	})
	@interceptor(newrelicInterceptor())
	async subscribeCustomerChange(
		@message() msg,
		@payload() customer: Customer,
		@channelParam() channel: ChannelWrapper
	) {
		await this.channelManager.publish('exchange2', {}, 'topic2');

		return { msg, customer, channel, channelManager: this.channelManager };
	}
}
