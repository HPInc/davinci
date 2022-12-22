/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { entity } from '@davinci/core';
import { mgoose } from '@davinci/mongoose';
import { createPartialSchema } from '../../lib/entity/createPartialSchema';
import { createQuerySchema } from '../../lib/entity/createQuerySchema';

@entity()
class Phone {
	@mgoose.prop()
	@entity.prop()
	isDefault: boolean;

	@mgoose.prop()
	@entity.prop({ required: true })
	phone: number;
}

class Birth {
	@mgoose.prop()
	@entity.prop()
	date: Date;

	@mgoose.prop()
	@entity.prop()
	country: string;
}

@mgoose.schema()
@entity()
export class Customer {
	@mgoose.prop({ minlength: 2 })
	@entity.prop({ minLength: 2 })
	firstname: string;

	@mgoose.prop({ required: true, minlength: 2 })
	@entity.prop({ required: true, minLength: 2 })
	lastname: string;

	@mgoose.prop({ type: [Phone] })
	@entity.prop({ type: [Phone] })
	phones: Phone[];

	@mgoose.prop()
	@entity.prop()
	birth: Birth;

	@mgoose.prop()
	modifiedCount: number;

	@mgoose.prop()
	@mgoose.populate({ name: 'logs', opts: { ref: 'Log', foreignField: '_id' } })
	logIds: Array<string>;
}

@entity()
export class CustomerPartial extends createPartialSchema<Customer>(Customer) {}

@entity()
export class CustomerQuery extends createQuerySchema(Customer, {
	queryablePaths: ['firstname', 'phones'],
	sortablePaths: [{ path: 'lastname', order: [1, -1] }]
}) {}
