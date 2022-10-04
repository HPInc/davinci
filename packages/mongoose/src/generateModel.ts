/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { model, Model, Schema, SchemaOptions } from 'mongoose';
import { ClassType, DecoratorId, PropertyReflection, reflect, TypeValue } from '@davinci/reflector';
import { IPropDecoratorOptions, IPropDecoratorOptionsFactory } from './decorators/types';

/**
 * Utility function that given a class passed as parameter,
 * it creates ad returns an object that will be used to generate a Mongoose schema
 * @param schemaType
 * @param options
 */
export const generateSchema = (
	schemaType: ClassType,
	options: SchemaOptions = { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
) => {
	const classReflection = reflect(schemaType);
	const propsWithMeta: {
		reflection: PropertyReflection;
		decorator: { options: IPropDecoratorOptions | IPropDecoratorOptionsFactory };
	}[] = classReflection.properties.reduce((acc, propReflection) => {
		const propDecorator = propReflection.decorators.find(d => d[DecoratorId] === 'mongoose.prop');
		if (propDecorator) {
			acc.push({ reflection: propReflection, decorator: propDecorator });
		}

		return acc;
	}, []);

	const rootIndexes = [];
	const rootPopulatedVirtuals = [];
	const rootVirtuals = [];
	const rootMethods = {};

	// loop over the variable decorated as props
	const definition = propsWithMeta.reduce((acc, { reflection, decorator: { options: opts } }) => {
		// eslint-disable-next-line no-shadow
		const options = typeof opts === 'function' ? opts() : opts;

		let type: TypeValue = options?.type ?? reflection.type;
		if (typeof options?.typeFactory === 'function') {
			type = options.typeFactory();
		}
		let isRawType = false;

		// explicit mongoose type passing, we can return
		if (options?.rawType) {
			type = options?.rawType;
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
				const {
					schema,
					indexes = [],
					populatedVirtuals = [],
					virtuals = [],
					methods = {}
				} = generateSchema(classType, null);
				type = schema;
				rootIndexes.push(...indexes);
				rootPopulatedVirtuals.push(...populatedVirtuals);
				rootVirtuals.push(...virtuals);
				Object.assign(rootMethods, methods);
			}
		}

		const prop = {
			...options,
			type
		};

		return {
			...acc,
			[reflection.name]: isArray ? [prop] : prop
		};
	}, {});

	// get schema options
	const schemaDecoration = classReflection.decorators.find(d => d[DecoratorId] === 'mongoose.schema');
	const schemaOptions = schemaDecoration?.options;
	const schema = schemaDecoration && new Schema(definition, options ?? schemaOptions);

	// register methods
	const methods = classReflection.methods.reduce((acc, methodReflection) => {
		const methodDecorator = methodReflection.decorators.find(d => d[DecoratorId] === 'mongoose.method');
		if (methodDecorator) {
			return {
				...acc,
				[methodReflection.name]: schemaType.prototype[methodReflection.name]
			};
		}
		return acc;
	}, {});

	// indexes
	const indexes = classReflection.decorators.filter(m => m[DecoratorId] === 'mongoose.index');

	// virtual fields that populates
	const populatedVirtuals = classReflection.properties.reduce((acc, propReflection) => {
		const populateDecorator = propReflection.decorators.find(d => d[DecoratorId] === 'mongoose.populate');
		if (populateDecorator) {
			acc.push({
				name: populateDecorator.name,
				options: { localField: populateDecorator.name, ...populateDecorator.options }
			});
		}

		return acc;
	}, []);

	// virtual fields
	const virtuals = classReflection.methods.reduce((acc, methodReflection) => {
		const virtualDecorator = methodReflection.decorators.find(d => d[DecoratorId] === 'mongoose.virtual');
		if (virtualDecorator) {
			acc.push({
				name: methodReflection.name,
				options: virtualDecorator.options,
				handler: virtualDecorator.handler
			});
		}

		return acc;
	}, []);

	if (schema) {
		schema.methods = { ...rootMethods, ...methods };
		[...rootPopulatedVirtuals, ...populatedVirtuals].forEach(({ name, options: o }) => {
			schema.virtual(name, o);
		});
		[...rootVirtuals, ...virtuals].forEach(({ name, options: o, handler }) => {
			const virtual = schema.virtual(name, o);
			if (typeof handler === 'function') {
				virtual.get(handler);
			}
		});
		[...rootIndexes, ...indexes].forEach(({ name, options: o }) => {
			schema.index(name, o);
		});
	}

	/*  TODO: implement static methods
	// get statics
	const statics = allMethods
		.filter(({ isStatic }) => isStatic)
		.filter(({ name }) => !EXCLUDED_STATIC_METHODS.includes(name))
		.reduce((acc, { name, handler }) => ({ ...acc, [name]: handler }), {}); */

	return { schema: schema ?? definition, ...(!schema ? { indexes, populatedVirtuals, virtuals, methods } : {}) };
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
	return model(modelName, schema, collectionName) as T & Model<T>;
}
