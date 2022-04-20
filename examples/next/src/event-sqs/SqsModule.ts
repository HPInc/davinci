/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { SqsEventsModule } from '@davinci/event-sqs';
import { OrderController } from './controllers/order';

export class SqsModule extends SqsEventsModule {
	constructor() {
		super({ controllers: [OrderController] });
	}
}
