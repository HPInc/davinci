/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { entity } from '@davinci/core';
import { Customer } from './customer.schema';

@entity()
export class Order {
	@entity.prop()
	id?: string;

	@entity.prop({ typeFactory: () => Customer })
	customer?: Customer;
}
