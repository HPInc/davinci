import 'reflect-metadata';
import { model, Schema, SchemaTypeOpts } from 'mongoose';

// Decorators
export function prop(opts?: SchemaTypeOpts<any>) {
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

export function index(index) {
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

// Helper functions
const getSchemaDefinition = (theClass: Function) => {
	const props = Reflect.getMetadata('tsmongoose:props', theClass.prototype);
	return props.reduce((acc, { key, opts = {} }: { key: string; opts: SchemaTypeOpts<any> }) => {
		let type = opts.type || Reflect.getMetadata('design:type', theClass.prototype, key);
		const isArray = Array.isArray(type) || type.name === 'Array';
		if (isArray && type.length > 0) {
			type = type[0];
		}

		const isFunction = ![String, Number, Object, Boolean].includes(type) && typeof type === 'function';
		if (isFunction) {
			type = getSchemaDefinition(type);
		}
		return {
			...acc,
			[key]: {
				...opts,
				type
			}
		};
	}, {});
};

const EXCLUDED_INSTANCE_METHODS = ['constructor'];
const EXCLUDED_STATIC_METHODS = ['name', 'length', 'prototype'];

export const generateModel = (theClass: Function, modelName = theClass.name, collectionName?) => {
	// get schema
	const schemaDef = getSchemaDefinition(theClass);

	// get methods
	const methods = Object.getOwnPropertyNames(theClass.prototype)
		.filter(n => !EXCLUDED_INSTANCE_METHODS.includes(n))
		.reduce((acc, methodName) => ({ ...acc, [methodName]: theClass.prototype[methodName] }), {});

	// get statics
	const statics = Object.getOwnPropertyNames(theClass)
		.filter(n => !EXCLUDED_STATIC_METHODS.includes(n))
		.reduce((acc, methodName) => ({ ...acc, [methodName]: theClass[methodName] }), {});

	// get indexes
	const indexes = Reflect.getMetadata('tsmongoose:indexes', theClass) || [];

	const schema = new Schema(schemaDef);
	schema.methods = methods;
	schema.statics = statics;
	if (indexes.length > 0) {
		schema.index(indexes);
	}

	return model(modelName, schema, collectionName);
};
