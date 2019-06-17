import { Document, Model } from 'mongoose';

export type InstanceType<T> = T & Document;
export type ModelType<T> = Model<InstanceType<T>> & T;
