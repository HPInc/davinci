import { model, Schema, SchemaTypeOpts, SchemaOptions } from 'mongoose';
import { ObjectId } from 'mongodb';

// Helper functions
export const getSchemaDefinition = (theClass: Function) => {
	const props = Reflect.getMetadata('tsmongoose:props', theClass.prototype) || [];
	return props.reduce((acc, { key, opts = {} }: { key: string; opts: SchemaTypeOpts<any> }) => {
		let type = opts.type || Reflect.getMetadata('design:type', theClass.prototype, key);
		const isArray = Array.isArray(type) || type.name === 'Array';
		if (isArray && type.length > 0) {
			type = type[0];
		}

		const isFunction = ![String, Number, Object, Boolean, Date].includes(type) && typeof type === 'function';
		if (type === ObjectId) {
			type = ObjectId;
		} else if (isFunction) {
			type = getSchemaDefinition(type);
		}

		if (type.ref) {
			const prop = {
				...opts,
				type: 'ObjectId',
				ref: type.ref.name
			};
			return {
				...acc,
				[key]: isArray ? [prop] : prop
			};
		}

		let prop = {
			...opts,
			type
		};

		if (typeof prop.type === 'object') {
			prop = { ...type };
		}

		return {
			...acc,
			[key]: isArray ? [prop] : prop
		};
	}, {});
};

const EXCLUDED_INSTANCE_METHODS = ['constructor'];
const EXCLUDED_STATIC_METHODS = ['name', 'length', 'prototype'];

export const generateSchema = (
	theClass: Function,
	options: SchemaOptions = { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
) => {
	// get schema
	const schemaDef = getSchemaDefinition(theClass);

	// get methods
	const methods = (Reflect.getMetadata('tsmongoose:methods', theClass.prototype) || [])
		.filter(({ name }) => !EXCLUDED_INSTANCE_METHODS.includes(name))
		.reduce((acc, { name, handler }) => ({ ...acc, [name]: handler }), {});

	// get statics
	const statics = (Reflect.getMetadata('tsmongoose:methods', theClass) || [])
		.filter(({ name }) => !EXCLUDED_STATIC_METHODS.includes(name))
		.reduce((acc, { name, handler }) => ({ ...acc, [name]: handler }), {});

	// get indexes
	const indexes = Reflect.getMetadata('tsmongoose:indexes', theClass) || [];

	// get virtual fields that allow population
	const populates = Reflect.getMetadata('tsmongoose:populates', theClass.prototype) || [];

	// get virtual fields
	const virtuals = Reflect.getMetadata('tsmongoose:virtuals', theClass.prototype) || [];

	const schema = new Schema(schemaDef, options);
	schema.methods = methods;
	schema.statics = statics;
	if (indexes.length > 0) {
		schema.index(indexes);
	}
	virtuals.forEach(({ name, handler }) => schema.virtual(name, handler));
	populates.forEach(({ name, options }) => schema.virtual(name, options));

	return schema;
};

export const generateModel = (
	theClass: Function,
	modelName = theClass.name,
	collectionName?,
	options?: SchemaOptions
) => {
	const schema = generateSchema(theClass, options);
	return model(modelName, schema, collectionName);
};
