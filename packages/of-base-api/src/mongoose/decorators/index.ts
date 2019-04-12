import { SchemaTypeOpts } from 'mongoose';

export function prop(opts?: SchemaTypeOpts<any>) {
	return function(target: Object, key: string | symbol) {
		const props = Reflect.getMetadata('tsmongoose:props', target) || [];
		props.push({ key, opts });
		Reflect.defineMetadata('tsmongoose:props', props, target);
	};
}

export function index(index) {
	return function(target: Object) {
		const indexes = Reflect.getMetadata('tsmongoose:indexes', target) || [];
		indexes.push(index);
		Reflect.defineMetadata('tsmongoose:indexes', indexes, target);
	};
}

export function method() {
	return function(target: Function | Object, key: string) {
		const isPrototype = typeof target === 'object' && typeof target.constructor === 'function';
		const isStatic = typeof target === 'function' && typeof target.prototype === 'object';
		const type = (isPrototype && 'prototype') || (isStatic && 'static');
		const handler = target[key];

		const methods = Reflect.getMetadata('tsmongoose:methods', target) || [];
		methods.push({ name: key, type, handler });

		Reflect.defineMetadata('tsmongoose:methods', methods, target);
	};
}

type VirtualArgs = {
	ref: string; // The model to use
	localField?: string; // Find people where `localField`
	foreignField: string; // is equal to `foreignField`
	// If `justOne` is true, 'members' will be a single doc as opposed to
	// an array. `justOne` is false by default.
	justOne?: boolean;
	options?: object;
};

export function populate({ name, opts }: { name: string; opts: VirtualArgs }) {
	return function(target: Object, key: string) {
		const options = { ...opts, localField: key };

		const populates = Reflect.getMetadata('tsmongoose:populates', target) || [];
		populates.push({ name, options });
		Reflect.defineMetadata('tsmongoose:populates', populates, target);
	};
}

export function virtual() {
	return function(target: Object, key: string) {
		const handler = target[key];
		const virtuals = Reflect.getMetadata('tsmongoose:virtuals', target) || [];
		virtuals.push({ name: key, handler });

		Reflect.defineMetadata('tsmongoose:virtuals', virtuals, target);
	};
}
