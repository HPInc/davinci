/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import amqplib, { Channel } from 'amqplib';
import type { ChannelWrapper, SetupFunc } from 'amqp-connection-manager';
import { CreateChannelOpts } from 'amqp-connection-manager';
import { ClassReflection, MethodReflection, TypeValue } from '@davinci/reflector';

export interface SubscriptionSettings {
	name: string;
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

export interface Subscription {
	channel?: ChannelWrapper;
	settings?: SubscriptionSettings;
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

export interface AmqpInterceptorContext {
	module: 'messaging-amqp';
	channel: Channel;
	subscription: Subscription;
	state: {};
	handlerArgs: any[];
}

export type { ChannelWrapper };
