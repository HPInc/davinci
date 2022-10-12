/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { DecoratorId } from '@davinci/reflector';
import { SubscriptionSettings } from '../types';

export type SubscribeDecoratorMetadata =
	| {
			[DecoratorId]: 'messaging-amqp.subscribe';
			subscriptionName: string;
	  }
	| { [DecoratorId]: 'messaging-amqp.subscribe'; options: SubscriptionSettings };
