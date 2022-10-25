/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { Level, Logger, pino } from 'pino';
import createDeepmerge from '@fastify/deepmerge';
import amqplib, { Channel, Message } from 'amqplib';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import stringify from 'fast-json-stable-stringify';
import { Subscription } from './types';

const deepmerge = createDeepmerge({ all: true });

export interface ChannelManagerOptions {
	logger?: {
		name?: string;
		level?: Level | 'silent';
	};
}

export class ChannelManager {
	private logger: Logger;
	private options: ChannelManagerOptions;
	private connection: AmqpConnectionManager;
	private channelsMap: Map<string, ChannelWrapper> = new Map();

	constructor(connection: AmqpConnectionManager, options: ChannelManagerOptions) {
		this.connection = connection;
		this.options = deepmerge({ logger: { name: 'ChannelManager', level: 'info' } }, options);
		this.logger = pino({ name: this.options.logger?.name });
		this.logger.level = this.options.logger?.level;
	}

	async subscribe(subscription: Subscription, handler: (msg: amqplib.ConsumeMessage | null) => void) {
		const setup = async (channel: Channel) => {
			await Promise.all([
				channel.assertExchange(
					subscription.settings.exchange,
					subscription.settings.exchangeType,
					subscription.settings.exchangeOptions
				),
				channel.assertQueue(subscription.settings.queue, subscription.settings.queueOptions),
				subscription.settings.prefetch ? channel.prefetch(subscription.settings.prefetch) : null,

				channel.bindQueue(
					subscription.settings.queue,
					subscription.settings.exchange,
					subscription.settings.topic
				),
				channel.consume(subscription.settings.queue, handler, {}).then(result => {
					subscription.consumerTag = result.consumerTag;
					return result;
				})
			]);
		};
		const channelKey = stringify({
			...subscription.settings?.channelOptions,
			prefetch: subscription.settings?.prefetch
		});

		// a channel with the same settings exists, reusing it
		if (this.channelsMap.has(channelKey)) {
			subscription.channel = this.channelsMap.get(channelKey);
			await subscription.channel.addSetup(setup);
		} else {
			subscription.channel = this.connection.createChannel({
				name: subscription.settings.name,
				json: subscription.settings.json,
				setup,
				...subscription.settings.channelOptions
			});
		}
		// eslint-disable-next-line require-atomic-updates
		subscription.setup = setup;
		this.channelsMap.set(channelKey, subscription.channel);

		await subscription.channel.waitForConnect();
	}

	unsubscribe(subscription: Subscription) {
		return subscription.channel.removeSetup(subscription.setup, async (channel: amqplib.ConfirmChannel) => {
			return channel.cancel(subscription.consumerTag);
		});
	}

	ackMessage(msg: Message, subscription: Subscription) {
		return subscription.channel.ack(msg);
	}

	nackMessage(msg: Message, subscription: Subscription, requeue = true) {
		return subscription.channel.nack(msg, null, requeue);
	}

	closeChannel(subscription: Subscription) {
		return subscription.channel.close();
	}

	getChannels() {
		return Array.from(this.channelsMap.values());
	}
}
