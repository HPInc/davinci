import { SchemaTypeOpts } from 'mongoose';

export function mongooseProp(opts?: SchemaTypeOpts<any>) {
	// this is the decorator factory
	return function(target: Object, key: string | symbol) {
		// this is the decorator

		// get the existing metadata props
		const props = Reflect.getMetadata('tsmongoose:props', target) || [];
		props.push({ key, opts });
		// define new metadata props
		Reflect.defineMetadata('tsmongoose:props', props, target);
	};
}

export function mongooseIndex(index) {
	// this is the decorator factory
	return function(target: Object) {
		// this is the decorator

		// get the existing metadata props
		const indexes = Reflect.getMetadata('tsmongoose:indexes', target) || [];
		indexes.push(index);
		// define new metadata props
		Reflect.defineMetadata('tsmongoose:indexes', indexes, target);
	};
}
