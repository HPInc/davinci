/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ExpressHttpModule } from '@davinci/http-express';
import { CustomerController } from './api/customer';

export class ApiModule extends ExpressHttpModule {
	constructor() {
		super({ controllers: [CustomerController] });
	}

	onInit() {}

	onDestroy() {}
}
