/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { entity } from '@davinci/core';

class Phone {
	@entity.prop()
	isDefault: boolean;

	@entity.prop({ required: true })
	phone: number;
}

@entity()
class Birth {
	@entity.prop()
	date: Date;

	@entity.prop()
	country: string;
}

@entity()
export class Customer {
	@entity.prop()
	firstname: string;

	@entity.prop({ required: true })
	lastname: string;

	@entity.prop({ type: [Phone] })
	phones: Phone[];

	@entity.prop()
	birth: Birth;
}
