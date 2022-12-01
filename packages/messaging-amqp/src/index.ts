/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { AmqpSubscribeOptions } from './types';

export * from './AmqpModule';
export * from './ChannelManager';
export * from './types';

declare module '@davinci/messaging' {
	interface SubscribeOptions {
		amqp?: AmqpSubscribeOptions;
	}
}
