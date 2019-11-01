import { model, Schema, SchemaOptions } from 'mongoose';
import { Reflector } from '@davinci/reflector';
import { ModelType } from './types';
import { IPropDecoratorMetadata } from './decorators/types';

/**
 * Utility function that given a class passed as parameter,
 * it creates ad returns an object that will be used to generate a Mongoose schema
 * @param theClass
 */
export const getSchemaDefinition = (theClass: Function) => {
	const props: IPropDecoratorMetadata[] =
		Reflector.getMetadata('davinci:mongoose:props', theClass.prototype.constructor) || [];

	// loop over the variable decorated as props
	return props.reduce((acc, { key, optsFactory }) => {
		const opts = optsFactory();
		// the type can be explicitly passed as option, or can be inferred
		// it's important to note that not in all the situations
		// the type can be retrieved with reflect-metadata, for example:
		// - arrays: [string] or [object] or [MyClass]
		// - objects
		let type =
			opts && opts.type ? opts.type : Reflector.getMetadata('design:type', theClass.prototype, key);

		if (opts && typeof opts.typeFactory === 'function') {
			type = opts.typeFactory();
		}

		const isArray = Array.isArray(type) || type.name === 'Array';
		if (isArray && type.length > 0) {
			// eslint-disable-next-line prefer-destructuring
			type = type[0];
		}

		const isFunction =
			![String, Number, Object, Boolean, Date, Schema.Types.ObjectId, Schema.Types.Mixed].includes(
				type
			) && typeof type === 'function';

		// if the type is a function, we need to recursively get the schema definition
		if (isFunction && type.name !== 'ObjectId' && type.name !== 'Mixed') {
			type = getSchemaDefinition(type);
		}

		if (type.ref) {
			const prop = {
				...opts,
				type: Schema.Types.ObjectId,
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

/**
 * Create an instance of a Mongoose schema from a class,
 * attaching virtuals, static/prototype methods, indexes
 * @param theClass
 * @param options
 */
export const generateSchema = (
	theClass: Function,
	options: SchemaOptions = { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
) => {
	// get schema
	const schemaDef = getSchemaDefinition(theClass);

	const allMethods =
		Reflector.getMetadata('davinci:mongoose:methods', theClass.prototype.constructor) || [];

	// get methods
	const methods = allMethods
		.filter(({ isPrototype }) => isPrototype)
		.filter(({ name }) => !EXCLUDED_INSTANCE_METHODS.includes(name))
		.reduce((acc, { name, handler }) => ({ ...acc, [name]: handler }), {});

	// get statics
	const statics = allMethods
		.filter(({ isStatic }) => isStatic)
		.filter(({ name }) => !EXCLUDED_STATIC_METHODS.includes(name))
		.reduce((acc, { name, handler }) => ({ ...acc, [name]: handler }), {});

	// get indexes
	const indexes = Reflector.getMetadata('davinci:mongoose:indexes', theClass) || [];

	// get virtual fields that allow population
	const populates =
		Reflector.getMetadata('davinci:mongoose:populates', theClass.prototype.constructor) || [];

	// get virtual fields
	const virtuals = Reflector.getMetadata('davinci:mongoose:virtuals', theClass.prototype.constructor) || [];

	const schema = new Schema(schemaDef, options);
	schema.methods = methods;
	schema.statics = statics;
	if (indexes.length > 0) {
		indexes.forEach(({ index, options: o }) => schema.index(index, o));
	}
	virtuals.forEach(({ name, handler }) => schema.virtual(name, handler));
	populates.forEach(({ name, options: o }) => schema.virtual(name, o));

	return schema;
};

/**
 * Create an instance of a Mongoose model
 * @param theClass
 * @param modelName
 * @param collectionName
 * @param options
 */
export function generateModel<T>(
	theClass: Function,
	modelName = theClass.name,
	collectionName?,
	options?: SchemaOptions
) {
	const schema = generateSchema(theClass, options);
	return model(modelName, schema, collectionName) as T & ModelType<T>;
}
