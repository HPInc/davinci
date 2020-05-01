/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { Reflector } from '@davinci/reflector';
import { IPropDecoratorOptions, IPropDecoratorOptionsFactory, IPropDecoratorMetadata } from './types';

/**
 * Decorate a props as mongoose schema property
 * @param options
 */
export function prop(options?: IPropDecoratorOptions | IPropDecoratorOptionsFactory) {
	return (prototype: object, key: string): void => {
		const optsFactory = () => (typeof options === 'function' ? options() : options);

		const metadata: IPropDecoratorMetadata = { key, optsFactory };
		Reflector.pushMetadata('davinci:mongoose:props', metadata, prototype.constructor);
	};
}

/**
 * Gives the ability to add compound indexes to a schema.
 * It decorates classes
 * @param index
 * @param options
 */
// eslint-disable-next-line no-shadow
export function index(index, options?: any) {
	return (target: Function): void => {
		Reflector.pushMetadata('davinci:mongoose:indexes', { index, options }, target);
	};
}

/**
 * Decorate a method as:
 * - mongoose static method is the class method is `static`
 * - mongoose method is the class method is a `prototype` method
 */
export function method() {
	return (target: Function | object, key: string): void => {
		const isPrototype = typeof target === 'object' && typeof target.constructor === 'function';
		const isStatic = typeof target === 'function' && typeof target.prototype === 'object';
		const realTarget = isPrototype ? target.constructor : target;
		const type = (isPrototype && 'prototype') || (isStatic && 'static');
		const handler = target[key];

		Reflector.pushMetadata(
			'davinci:mongoose:methods',
			{ name: key, type, handler, isStatic, isPrototype },
			realTarget
		);
	};
}

export interface IVirtualArgs {
	ref: string; // The model to use
	localField?: string; // Find people where `localField`
	foreignField: string; // is equal to `foreignField`
	// If `justOne` is true, 'members' will be a single doc as opposed to
	// an array. `justOne` is false by default.
	justOne?: boolean;
	options?: object;
}

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
export function populate({ name, opts }: { name: string; opts: IVirtualArgs }) {
	return (target: object, key: string): void => {
		const options = { ...opts, localField: key };
		Reflector.pushMetadata('davinci:mongoose:populates', { name, options }, target.constructor);
	};
}

/**
 * Decorator that annotate a method marking it as virtual.
 * The annotated method will be used as the `getter` of the virtual
 */
export function virtual(options?: IVirtualArgs) {
	return (target: object, key: string): void => {
		const handler = target[key];
		if (options?.ref && typeof handler === 'function') {
			throw new Error(
				'Ref and getter cannot be used together. Please read: https://mongoosejs.com/docs/guide.html#virtuals'
			);
		}

		Reflector.pushMetadata('davinci:mongoose:virtuals', { name: key, handler, options }, target.constructor);
	};
}
