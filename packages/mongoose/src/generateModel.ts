/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { model, Model, Schema, SchemaDefinition, SchemaOptions } from 'mongoose';
import { ClassType, DecoratorId, PropertyReflection, reflect, TypeValue } from '@davinci/reflector';
import { omit } from '@davinci/core';
import deepmerge from 'deepmerge';
import { IPropDecoratorOptions, IPropDecoratorOptionsFactory } from './decorators/types';
import {
	IndexDecoratorMetadata,
	IVirtualArgs,
	PopulateDecoratorMetadata,
	VirtualDecoratorMetadata
} from './decorators';

type RecursivelyGenerateSchemaReturnType<T> = {
	schema: Schema<T> | SchemaDefinition;
	indexes?: Array<IndexDecoratorMetadata>;
	populatedVirtuals?: Array<PopulateDecoratorMetadata>;
	virtuals?: Array<VirtualDecoratorMetadata & { name: string }>;
	methods?: Record<string, (...args: any[]) => any>;
};

const DEFAULT_SCHEMA_OPTIONS = { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } };

/**
 * Utility function that given a class passed as parameter,
 * it creates ad returns an object that will be used to generate a Mongoose schema
 * @param schemaType
 * @param options
 */
export const generateSchema = <T>(
	schemaType: ClassType,
	options?: SchemaOptions
): Schema<T> => {
	const recursivelyGenerateSchema = <U>(
		// eslint-disable-next-line no-shadow
		schemaType: ClassType,
		// eslint-disable-next-line no-shadow
		options?: SchemaOptions,
		forceCreateSchema?: boolean
	): RecursivelyGenerateSchemaReturnType<U> => {
		const mergedOptions = options ? deepmerge(DEFAULT_SCHEMA_OPTIONS, options) : DEFAULT_SCHEMA_OPTIONS;
		const classReflection = reflect(schemaType);
		const propsWithMeta = classReflection.properties.reduce<
			Array<{
				reflection: PropertyReflection;
				decorator: { options: IPropDecoratorOptions | IPropDecoratorOptionsFactory };
			}>
		>((acc, propReflection) => {
			const propDecorator = propReflection.decorators.find(d => d[DecoratorId] === 'mongoose.prop');
			if (propDecorator) {
				acc.push({ reflection: propReflection, decorator: propDecorator });
			}

			return acc;
		}, []);

		const rootIndexes: Array<IndexDecoratorMetadata> = [];
		const rootPopulatedVirtuals: Array<PopulateDecoratorMetadata> = [];
		const rootVirtuals: Array<VirtualDecoratorMetadata & { name: string }> = [];
		const rootMethods: Record<string, (...args: any[]) => any> = {};

		// loop over the variable decorated as props
		const definition = propsWithMeta.reduce((acc, { reflection, decorator: { options: opts } }) => {
			// eslint-disable-next-line no-shadow
			const options = typeof opts === 'function' ? opts() : opts;

			let type: TypeValue | Array<TypeValue> = options?.type ?? reflection.type;
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
			if (Array.isArray(type) && (type as any[]).length > 0) {
				type = type[0];
			}

			const isFunction =
				!(
					[String, Number, Object, Boolean, Date, Schema.Types.ObjectId, Schema.Types.Mixed] as unknown[]
				).includes(type) &&
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
					} = recursivelyGenerateSchema(classType);
					type = schema;
					rootIndexes.push(...indexes);
					rootPopulatedVirtuals.push(...populatedVirtuals);
					rootVirtuals.push(...virtuals);
					Object.assign(rootMethods, methods);
				}
			}

			const prop = {
				...omit(options ?? {}, ['type']),
				type
			};

			return {
				...acc,
				[reflection.name]: isArray ? [prop.type] : prop
			};
		}, {});

		// get schema options
		const schemaDecoration = classReflection.decorators.find(d => d[DecoratorId] === 'mongoose.schema');
		const schemaOptions = schemaDecoration?.options;
		const schema: Schema<U> =
			(forceCreateSchema || schemaDecoration) &&
				new Schema(definition, { ...(mergedOptions ?? schemaOptions) });

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

		const populatedVirtuals = [
			// properties with @populate decorator
			...classReflection.properties.reduce<Array<PopulateDecoratorMetadata>>((acc, propReflection) => {
				const populateDecorator = propReflection.decorators.find(d => d[DecoratorId] === 'mongoose.populate');
				if (populateDecorator) {
					acc.push({
						name: populateDecorator.name,
						options: { localField: propReflection.name, ...populateDecorator.options }
					});
				}

				return acc;
			}, []),
			// properties with @virtual decorator
			...classReflection.properties.reduce<Array<{ name: string; options: IVirtualArgs }>>(
				(acc, propReflection) => {
					const virtualDecorator: { options: IVirtualArgs } = propReflection.decorators.find(
						d => d[DecoratorId] === 'mongoose.virtual'
					);
					if (virtualDecorator) {
						acc.push({
							name: propReflection.name,
							options: { localField: propReflection.name, ...virtualDecorator.options }
						});
					}

					return acc;
				},
				[]
			)
		];

		// virtual fields with getter method
		const virtuals = classReflection.methods.reduce<Array<VirtualDecoratorMetadata & { name: string }>>(
			(acc, methodReflection) => {
				const virtualDecorator = methodReflection.decorators.find(d => d[DecoratorId] === 'mongoose.virtual');
				if (virtualDecorator) {
					acc.push({
						name: methodReflection.name,
						options: virtualDecorator.options,
						handler: virtualDecorator.handler
					});
				}

				return acc;
			},
			[]
		);

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
			[...rootIndexes, ...indexes].forEach(({ fields, options: o }) => {
				schema.index(fields, o);
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

	const { schema } = recursivelyGenerateSchema<T>(schemaType, options, true);

	return schema as Schema<T>;
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
	collectionName?: string,
	options?: SchemaOptions
): Model<T> {
	const schema = generateSchema<T>(classSchema, options);
	return model<T>(modelName, schema, collectionName);
}
