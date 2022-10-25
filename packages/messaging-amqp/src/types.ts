/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import amqplib from 'amqplib';
import type { ChannelWrapper, SetupFunc } from 'amqp-connection-manager';
import { CreateChannelOpts } from 'amqp-connection-manager';
import { ClassReflection, DecoratorId, MethodReflection, TypeValue } from '@davinci/reflector';
import { SubscribeOptions } from '@davinci/messaging';
import { Interceptor, InterceptorBagDetails } from '@davinci/core';

export interface AmqpSubscribeOptions {
	exchange: string;
	topic?: string;
	queue: string;
	prefetch?: number;
	json?: boolean;
	/**
	 * @defaultValue true
	 */
	autoAck?: boolean;
	/**
	 * @defaultValue { enabled: false }
	 */
	autoNack?: boolean | { enabled?: boolean; requeue?: boolean };

	channelOptions?: CreateChannelOpts;
	/**
	 * @defaultValue `topic`
	 */
	exchangeType?: 'direct' | 'topic' | 'headers' | 'fanout' | 'match' | string;
	exchangeOptions?: amqplib.Options.AssertExchange;
	queueOptions?: amqplib.Options.AssertQueue;
}

export interface AmqpSubscriptionSettings extends AmqpSubscribeOptions {
	name: string;
}

export interface Subscription {
	channel?: ChannelWrapper;
	settings?: AmqpSubscriptionSettings;
	consumerTag?: string;
	setup?: SetupFunc;
}

export type ParameterConfiguration =
	| {
			name: string;
			source: 'message' | 'payload' | 'channel';
			value?: unknown;
			type?: TypeValue;
	  }
	| {
			source: 'context';
			reflection: { controllerReflection: ClassReflection; methodReflection: MethodReflection };
			value?: unknown;
	  };

/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

export type SubscribeDecoratorMetadata = {
	[DecoratorId]: 'messaging-amqp.subscribe';
	options: SubscribeOptions;
};

export type AmqpInterceptor<IBD extends InterceptorBagDetails = InterceptorBagDetails> = Interceptor<
	IBD,
	{ channel: ChannelWrapper; subscription: Subscription }
>;

export type { ChannelWrapper };
