/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { model, Schema, SchemaDefinition, SchemaOptions } from 'mongoose';
import { ClassType, Reflector, TypeValue } from '@davinci/reflector';
import { ModelType } from './types';
import { IPropDecoratorMetadata } from './decorators/types';

const EXCLUDED_INSTANCE_METHODS = ['constructor'];
const EXCLUDED_STATIC_METHODS = ['name', 'length', 'prototype'];

/**
 * Create an instance of a Mongoose schema from a class,
 * attaching virtuals, static/prototype methods, indexes
 * @param classSchema
 * @param definition
 * @param options
 */
export const createMongooseSchema = (classSchema: ClassType, definition: SchemaDefinition, options: SchemaOptions) => {
	const allMethods = Reflector.getMetadata('davinci:mongoose:methods', classSchema.prototype.constructor) || [];

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
	const indexes = Reflector.getMetadata('davinci:mongoose:indexes', classSchema) || [];

	// get virtual fields that allow population
	const populates = Reflector.getMetadata('davinci:mongoose:populates', classSchema.prototype.constructor) || [];

	// get virtual fields
	const virtuals = Reflector.getMetadata('davinci:mongoose:virtuals', classSchema.prototype.constructor) || [];

	// get schema options
	const decoratorOptions = Reflector.getMetadata('davinci:mongoose:schemaOptions', classSchema.prototype.constructor);

	const schema = new Schema(definition, options ?? decoratorOptions);
	schema.methods = methods;
	schema.statics = statics;
	if (indexes.length > 0) {
		indexes.forEach(({ index, options: o }) => schema.index(index, o));
	}
	virtuals.forEach(({ name, options: opts, handler }) => {
		const virtual = schema.virtual(name, opts);
		if (typeof handler === 'function') {
			virtual.get(handler);
		}
	});
	populates.forEach(({ name, options: o }) => schema.virtual(name, o));

	return schema;
};

/**
 * Utility function that given a class passed as parameter,
 * it creates ad returns an object that will be used to generate a Mongoose schema
 * @param classSchema
 * @param options
 * @param returnMongooseSchema
 */
export const generateSchema = (
	classSchema: ClassType,
	options: SchemaOptions = { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
	returnMongooseSchema = true
) => {
	const props: IPropDecoratorMetadata[] =
		Reflector.getMetadata('davinci:mongoose:props', classSchema.prototype.constructor) || [];

	// loop over the variable decorated as props
	const definition = props.reduce((acc, { key, optsFactory }) => {
		const opts = optsFactory();
		// the type can be explicitly passed as option, or can be inferred
		// it's important to note that not in all the situations
		// the type can be retrieved with reflect-metadata, for example:
		// - arrays: [string] or [object] or [MyClass]
		// - objects
		let type: TypeValue = opts?.type;
		let isRawType = false;

		if (!type) {
			if (typeof opts?.typeFactory === 'function') {
				type = opts.typeFactory();
			} else {
				type = Reflector.getMetadata('design:type', classSchema.prototype, key);
			}
		}

		// explicit mongoose type passing, we can return
		if (opts?.rawType) {
			type = opts?.rawType;
			isRawType = true;
		}

		const isArray = Array.isArray(type);
		if (isArray && (type as any[]).length > 0) {
			// eslint-disable-next-line prefer-destructuring
			type = type[0];
		}

		const isFunction =
			!([String, Number, Object, Boolean, Date, Schema.Types.ObjectId, Schema.Types.Mixed] as unknown[]).includes(
				type
			) &&
			typeof type === 'function' &&
			!isRawType;

		// if the type is a function, we need to recursively get the schema definition
		if (isFunction) {
			const classType = type as ClassType;
			if (classType.name !== 'ObjectId' && classType.name !== 'Mixed') {
				// passing null to avoid setting the options recursively to sub-schemas
				type = generateSchema(classType, null, returnMongooseSchema);
			}
		}

		const prop = {
			...opts,
			type
		};

		return {
			...acc,
			[key]: isArray ? [prop] : prop
		};
	}, {});

	return returnMongooseSchema ? createMongooseSchema(classSchema, definition, options) : definition;
};

/**
 * Create an instance of a Mongoose model
 * @param classSchema
 * @param modelName
 * @param collectionName
 * @param options
 */
export function generateModel<T>(
	classSchema: ClassType,
	modelName = classSchema.name,
	collectionName?,
	options?: SchemaOptions
) {
	const schema = generateSchema(classSchema, options);
	return model(modelName, schema, collectionName) as T & ModelType<T>;
}
