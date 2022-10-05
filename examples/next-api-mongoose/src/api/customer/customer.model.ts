/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { mgoose } from '@davinci/mongoose';
import { Customer } from './customer.schema';

export const CustomerModel = mgoose.generateModel<Customer>(Customer);
