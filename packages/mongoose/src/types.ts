/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { Document, Model } from 'mongoose';

export type InstanceType<T> = T & Document;
export type ModelType<T> = Model<InstanceType<T>> & T;
