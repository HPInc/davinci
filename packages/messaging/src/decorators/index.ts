/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { decorate, DecoratorId } from '@davinci/reflector';
import { SubscribeOptions } from '../types';

export function subscribe(options: SubscribeOptions) {
	return decorate(
		{
			[DecoratorId]: 'messaging.subscribe',
			options
		},
		['Method'],
		{ allowMultiple: false, inherit: true }
	);
}

export function message() {
	return decorate(
		{
			[DecoratorId]: 'messaging.parameter',
			options: { in: 'message' }
		},
		['Parameter'],
		{ allowMultiple: false, inherit: true }
	);
}

export function payload() {
	return decorate(
		{
			[DecoratorId]: 'messaging.parameter',
			options: { in: 'payload' }
		},
		['Parameter'],
		{ allowMultiple: false, inherit: true }
	);
}

export function channelParam() {
	return decorate(
		{
			[DecoratorId]: 'messaging.parameter',
			options: { in: 'channel' }
		},
		['Parameter'],
		{ allowMultiple: false, inherit: true }
	);
}
