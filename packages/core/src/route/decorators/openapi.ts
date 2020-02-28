import { Reflector } from '@davinci/reflector';
import _ from 'lodash';
import { IPropDecoratorOptions, IPropDecoratorOptionsFactory, IPropDecoratorMetadata } from '../types';

/**
 * It annotates a variable as swagger definition property
 * @param {IPropDecoratorOptions} opts
 */
export function prop(opts?: IPropDecoratorOptions | IPropDecoratorOptionsFactory) {
	return function(prototype: Record<string, any>, key: string): void {
		const optsFactory = () => {
			const options = typeof opts === 'function' ? opts() : opts;
			if (options && _.isUndefined(options?.type) && !_.isFunction(options?.typeFactory)) {
				options.type = Reflector.getMetadata('design:type', prototype, key);
			}

			return options;
		};
		const metadata: IPropDecoratorMetadata = { key, optsFactory };
		Reflector.pushMetadata('davinci:openapi:props', metadata, prototype.constructor);
	};
}

/**
 * It annotates a class.
 * Its definition will be added in the `definitions` property
 * @param options
 */
export function definition(options?: { title }) {
	return function(target: Function): void {
		Reflector.defineMetadata('davinci:openapi:definition', options, target);
	};
}
