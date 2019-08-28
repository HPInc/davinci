import { Reflector } from '@davinci/reflector';

/**
 * It annotates a variable as swagger definition property
 * @param opts
 */
export function prop(opts?: { type?: any; required?: boolean }) {
	return function(target: Object, key: string | symbol): void {
		Reflector.pushMetadata('tsopenapi:props', { key, opts }, target);
	};
}

/**
 * It annotates a class.
 * Its definition will be added in the `definitions` property
 * @param definition
 */
export function definition(definition?: { title }) {
	return function(target: Object): void {
		Reflector.defineMetadata('tsopenapi:definition', definition, target);
	};
}
