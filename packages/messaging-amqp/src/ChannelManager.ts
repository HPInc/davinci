/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { Level, Logger, pino } from 'pino';
import createDeepmerge from '@fastify/deepmerge';
import { di } from '@davinci/core';
import amqplib, { Channel, Message } from 'amqplib';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import stringify from 'fast-json-stable-stringify';
import { AmqpSubscriptionSettings, Subscription } from './types';

const deepmerge = createDeepmerge({ all: true });

export interface ChannelManagerOptions {
	logger?: {
		name?: string;
		level?: Level | 'silent';
	};
	defaultChannelSettings?: AmqpSubscriptionSettings;
}

@di.singleton()
export class ChannelManager {
	private logger: Logger;
	private options: ChannelManagerOptions;
	private connection: AmqpConnectionManager;
	private channelsMap: Map<string, ChannelWrapper> = new Map();
	private defaultChannel: ChannelWrapper;

	public async subscribe(subscription: Subscription, handler: (msg: amqplib.ConsumeMessage | null) => void) {
		const { key: channelKey, channelWrapper } = await this.createChannel(subscription.settings);
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

		// eslint-disable-next-line require-atomic-updates
		subscription.channel = channelWrapper;
		await subscription.channel.addSetup(setup);

		// eslint-disable-next-line require-atomic-updates
		subscription.setup = setup;
		this.channelsMap.set(channelKey, subscription.channel);

		await subscription.channel.waitForConnect();
	}

	public async publish(
		exchange: string,
		msg: any,
		topic: string,
		messageOptions?: amqplib.Options.Publish,
		subscription?: Subscription
	) {
		// use channel from subscription, or the default channel
		const channelWrapper = subscription?.channel ?? (await this.getDefaultChannel());
		const exchangeType = subscription?.settings?.exchangeType ?? this.options?.defaultChannelSettings?.exchangeType;
		const exchangeOptions =
			subscription?.settings?.exchangeOptions ?? this.options?.defaultChannelSettings?.exchangeOptions;

		await channelWrapper.assertExchange(exchange, exchangeType, exchangeOptions);

		return channelWrapper.publish(exchange, topic || '', msg, messageOptions);
	}

	public unsubscribe(subscription: Subscription) {
		return subscription.channel.removeSetup(subscription.setup, async (channel: amqplib.ConfirmChannel) => {
			return channel.cancel(subscription.consumerTag);
		});
	}

	public ackMessage(msg: Message, subscription: Subscription) {
		return subscription.channel.ack(msg);
	}

	public nackMessage(msg: Message, subscription: Subscription, requeue = true) {
		return subscription.channel.nack(msg, null, requeue);
	}

	public closeChannel(subscription: Subscription) {
		return subscription.channel.close();
	}

	public getChannels() {
		return Array.from(this.channelsMap.values());
	}

	public setConnection(connection: AmqpConnectionManager) {
		this.connection = connection;

		return this;
	}

	public setOptions(options: ChannelManagerOptions) {
		this.options = deepmerge({ logger: { name: 'ChannelManager', level: 'info' } }, options);
		this.logger = pino({ name: this.options.logger?.name });
		this.logger.level = this.options.logger?.level;

		return this;
	}

	private async createChannel(
		settings?: AmqpSubscriptionSettings
	): Promise<{ key: string; channelWrapper: ChannelWrapper }> {
		const channelKey = stringify({
			...settings?.channelOptions,
			prefetch: settings?.prefetch
		});

		let channelWrapper: ChannelWrapper;

		// a channel with the same settings exists, reusing it
		if (this.channelsMap.has(channelKey)) {
			channelWrapper = this.channelsMap.get(channelKey);
		} else {
			channelWrapper = this.connection.createChannel({
				name: settings?.name,
				json: settings?.json,
				...settings?.channelOptions
			});
		}
		// eslint-disable-next-line require-atomic-updates
		this.channelsMap.set(channelKey, channelWrapper);

		await channelWrapper.waitForConnect();

		return { key: channelKey, channelWrapper };
	}

	private async getDefaultChannel() {
		if (this.defaultChannel) {
			return this.defaultChannel;
		}

		this.defaultChannel = (await this.createChannel(this.options?.defaultChannelSettings)).channelWrapper;

		return this.defaultChannel;
	}
}
