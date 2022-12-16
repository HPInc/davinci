/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { entity } from '@davinci/core';
import { createPartialEntity } from '../../lib/createPartialEntity';
import { createResourceListResponseEntity } from '../../lib/createResourceListResponseEntity';

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
	id?: string;

	@entity.prop({ minLength: 2 })
	firstname?: string;

	@entity.prop({ required: true, minLength: 2 })
	lastname: string;

	@entity.prop({ type: [Phone] })
	phones?: Phone[];

	@entity.prop()
	birth?: Birth;

	modifiedCount?: number;
}

export class CustomerPartial extends createPartialEntity<Customer>(Customer) {}

export class CustomerList extends createResourceListResponseEntity<Customer>(Customer) {}
