/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { Reflector } from '@davinci/reflector';
import _ from 'lodash';
import {
	IPropDecoratorOptions,
	IPropDecoratorOptionsFactory,
	IPropDecoratorMetadata,
	IDefinitionDecoratorOptions
} from '../types';

/**
 * It annotates a variable as swagger definition property
 * @param {IPropDecoratorOptions} opts
 */
export function prop<T = any>(opts?: IPropDecoratorOptions<T> | IPropDecoratorOptionsFactory<T>): PropertyDecorator {
	return function(prototype: Record<string, any>, key: string): void {
		const optsFactory = () => {
			const options = typeof opts === 'function' ? opts() : opts;
			if (options && _.isUndefined(options?.type) && !_.isFunction(options?.typeFactory)) {
				options.type = Reflector.getMetadata('design:type', prototype, key);
			}

			return options;
		};
		const metadata: IPropDecoratorMetadata<T> = { key, optsFactory };
		Reflector.pushMetadata('davinci:openapi:props', metadata, prototype.constructor);
	};
}

/**
 * It annotates a class.
 * Its definition will be added in the `definitions` property
 * @param options
 */
export function definition<T = any>(options?: IDefinitionDecoratorOptions<T>): ClassDecorator {
	return function(target: Function): void {
		Reflector.defineMetadata('davinci:openapi:definition', options ?? {}, target);
	};
}
