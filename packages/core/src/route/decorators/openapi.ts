import { Reflector } from '@davinci/reflector';
import { IPropDecoratorOptions, IPropDecoratorOptionsFactory, IPropDecoratorMetadata } from '../types';

/**
 * It annotates a variable as swagger definition property
 * @param {IPropDecoratorOptions} opts
 */
export function prop(opts?: IPropDecoratorOptions | IPropDecoratorOptionsFactory) {
	return function(prototype: Object, key: string): void {
		const optsFactory = () => {
			const options = typeof opts === 'function' ? opts() : opts;
			if (options && !options.type && !options.typeFactory) {
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
 * @param definition
 */
export function definition(definition?: { title }) {
	return function(target: Function): void {
		Reflector.defineMetadata('davinci:openapi:definition', definition, target);
	};
}
