/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { IndexOptions, SchemaOptions, VirtualTypeOptions } from 'mongoose';
import { decorate, DecoratorId } from '@davinci/reflector';
import { IPropDecoratorOptions } from './types';

/**
 * Decorate a props as mongoose schema property
 * @param options
 */
export function prop(options?: IPropDecoratorOptions): PropertyDecorator {
	return decorate(
		{
			[DecoratorId]: 'mongoose.prop',
			options
		},
		['Property', 'Method'],
		{ allowMultiple: false, inherit: true }
	);
}

/**
 * Gives the ability to add compound indexes to a schema.
 * It decorates classes
 * @param name
 * @param options
 */
// eslint-disable-next-line no-shadow
export function index(name, options?: IndexOptions): ClassDecorator {
	return decorate(
		{
			[DecoratorId]: 'mongoose.index',
			name,
			options
		},
		['Class'],
		{ allowMultiple: false, inherit: true }
	);
}

/**
 * Decorate a method as:
 * - mongoose static method is the class method is `static`
 * - mongoose method is the class method is a `prototype` method
 */
export function method(): MethodDecorator {
	return decorate(
		{
			[DecoratorId]: 'mongoose.method'
		},
		['Method'],
		{ allowMultiple: false, inherit: true }
	);
}

export type IVirtualArgs = VirtualTypeOptions;

/**
 * Decorator that annotates a field as localField
 * for a virtual property
 * Example:
 *   @populate({ name: 'file', opts: { ref: 'File', foreignField: '_id', justOne: true } })
 *   fileId: string
 *
 * will create a `file` property that will use `fileId` as localField
 *
 * @param name
 * @param opts
 */
export function populate({ name, opts }: { name: string; opts: IVirtualArgs }): PropertyDecorator {
	return decorate(
		{
			[DecoratorId]: 'mongoose.populate',
			name,
			options: opts
		},
		['Property'],
		{ allowMultiple: false, inherit: true }
	);
}

/**
 * Decorator that annotates a method marking it as virtual.
 * The annotated method will be used as the `getter` of the virtual
 */
export function virtual(options?: IVirtualArgs): MethodDecorator & PropertyDecorator {
	return (...args: [target: object, key: string]): void => {
		const [target, key] = args;
		const handler = target[key];
		if (options?.ref && typeof handler === 'function') {
			throw new Error(
				'Ref and getter cannot be used together. Please read: https://mongoosejs.com/docs/guide.html#virtuals'
			);
		}

		return decorate(
			{
				[DecoratorId]: 'mongoose.virtual',
				handler,
				options
			},
			['Method', 'Property'],
			{ allowMultiple: false, inherit: true }
		)(...args);
	};
}

/**
 * Decorator that annotates a schema, allowing to pass options to the mongoose 'Schema' constructor
 */
export function schema(options?: SchemaOptions): ClassDecorator {
	return decorate(
		{
			[DecoratorId]: 'mongoose.schema',
			options
		},
		['Class'],
		{ allowMultiple: false, inherit: true }
	);
}
