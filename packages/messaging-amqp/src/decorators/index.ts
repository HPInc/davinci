/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { decorate, DecoratorId } from '@davinci/reflector';
import { SubscriptionSettings } from '../types';

export function subscribe(nameOrOptions: string | SubscriptionSettings) {
	return decorate(
		{
			[DecoratorId]: 'messaging-amqp.subscribe',
			[typeof nameOrOptions === 'string' ? 'subscriptionName' : 'options']: nameOrOptions
		},
		['Method'],
		{ allowMultiple: false, inherit: true }
	);
}

export function message() {
	return decorate(
		{
			[DecoratorId]: 'messaging-amqp.parameter',
			options: { in: 'message' }
		},
		['Parameter'],
		{ allowMultiple: false, inherit: true }
	);
}

export function payload() {
	return decorate(
		{
			[DecoratorId]: 'messaging-amqp.parameter',
			options: { in: 'payload' }
		},
		['Parameter'],
		{ allowMultiple: false, inherit: true }
	);
}

export function channelParam() {
	return decorate(
		{
			[DecoratorId]: 'messaging-amqp.parameter',
			options: { in: 'channel' }
		},
		['Parameter'],
		{ allowMultiple: false, inherit: true }
	);
}
