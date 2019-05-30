/**
 * It annotates a variable as swagger definition property
 * @param opts
 */
export function prop(opts?: { type?: any; required?: boolean }) {
	// this is the decorator factory
	return function(target: Object, key: string | symbol): void {
		// this is the decorator

		// get the existing metadata props
		const props = Reflect.getMetadata('tsopenapi:props', target) || [];
		props.push({ key, opts });
		// define new metadata props
		Reflect.defineMetadata('tsopenapi:props', props, target);
	};
}

/**
 * It annotates a class.
 * Its definition will be added in the `definitions` property
 * @param definition
 */
export function definition(definition?: { title }) {
	// this is the decorator factory
	return function(target: Object): void {
		// this is the decorator
		// define new metadata props
		Reflect.defineMetadata('tsopenapi:definition', definition, target);
	};
}
