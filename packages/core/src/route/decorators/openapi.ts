import { Reflector } from '@davinci/reflector';

/**
 * It annotates a variable as swagger definition property
 * @param opts
 */
export function prop(opts?: { type?: any; required?: boolean }) {
	return function(prototype: Object, key: string | symbol): void {
		Reflector.pushMetadata('davinci:openapi:props', { key, opts }, prototype.constructor);
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
