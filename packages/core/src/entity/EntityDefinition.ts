/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import {
	ClassReflection,
	ClassType,
	DecoratorId,
	Maybe,
	PropertyReflection,
	reflect,
	TypeValue
} from '@davinci/reflector';
import deepMerge from 'deepmerge';
import { EntityDefinitionJSONSchema, EntityOptions, EntityPropReflection, JSONSchema } from './types';
import { isPlainObject, omit } from '../lib/object-utils';
import { transformEntityDefinitionSchema } from './json/transformEntityDefinitionSchema';

interface EntityDefinitionOptions {
	name?: string;
	type?: TypeValue;
	jsonSchema?: JSONSchema;
	// eslint-disable-next-line no-use-before-define
	entityDefinitionsMapCache?: Map<TypeValue, EntityDefinition>;
	reflect?: boolean;
}

/**
 * The EntityDefinition class serves as a base class that provides a wrapper for "complex" entities and their properties.
 * In this context, "complex" refers to schemas that are represented by classes.
 */
export class EntityDefinition {
	private name?: string;
	private readonly type?: TypeValue;
	private entityDefinitionJsonSchema?: EntityDefinitionJSONSchema;
	private entityDefinitionsMapCache: Map<TypeValue, EntityDefinition>;

	constructor(options: EntityDefinitionOptions) {
		if (!options.type && !options.jsonSchema) {
			throw new Error('type or entityDefinitionJsonSchema must be passed');
		}
		this.type = options.type;
		this.name = options.name ?? (this.type as ClassType)?.name;
		this.entityDefinitionsMapCache = options.entityDefinitionsMapCache ?? new Map<TypeValue, EntityDefinition>();
		if (!options.reflect) {
			this.entityDefinitionJsonSchema = this.reflect();
		}
	}

	public getName() {
		return this.name;
	}

	public getEntityDefinitionJsonSchema() {
		this.entityDefinitionJsonSchema = this.entityDefinitionJsonSchema ?? this.reflect();

		return this.entityDefinitionJsonSchema;
	}

	public getType() {
		return this.type;
	}

	/**
	 * This method traverses the class and generates the EntityDefinitionJSONSchema
	 */
	private reflect(): EntityDefinitionJSONSchema {
		const makeSchema = (
			typeOrClass: TypeValue | StringConstructor | NumberConstructor | BooleanConstructor | Date,
			key?: string
		): Partial<JSONSchema> | null => {
			// it's a primitive type, simple case
			if (typeOrClass === String || typeOrClass === Number || typeOrClass === Boolean || typeOrClass === Date) {
				const type = typeOrClass as
					| StringConstructor
					| NumberConstructor
					| BooleanConstructor
					| DateConstructor;

				if (typeOrClass === Date) {
					return { type: 'string', format: 'date-time' };
				}

				return { type: type.name.toLowerCase() };
			}

			// it's an array => recursively call makeSchema on the first array element
			if (Array.isArray(typeOrClass)) {
				return {
					type: 'array',
					items: makeSchema(typeOrClass[0], key)
				};
			}

			// it's a class => reflect and recursively call makeSchema on the properties
			if (typeof typeOrClass === 'function') {
				const reflection = reflect(typeOrClass as ClassType);
				const entityDecorator = this.findEntityDecorator(reflection);

				if (entityDecorator && this.type === typeOrClass) {
					this.name = entityDecorator.options?.name ?? this.name;
				}

				if (entityDecorator && this.type !== typeOrClass) {
					const theClass = <TypeValue>typeOrClass;

					if (this.entityDefinitionsMapCache?.has(theClass)) {
						const entityDefinition = this.entityDefinitionsMapCache?.get(theClass);

						return {
							_$ref: entityDefinition
						};
					}

					const entityDefinition = new EntityDefinition({
						type: theClass,
						entityDefinitionsMapCache: this.entityDefinitionsMapCache,
						reflect: false
					});
					// eslint-disable-next-line no-unused-expressions
					this.entityDefinitionsMapCache?.set(theClass, entityDefinition);
					entityDefinition.reflect();

					return {
						_$ref: entityDefinition
					};
				}

				const entityProps = this.filterEntityPropDecorators(reflection);
				const { properties, required } =
					entityProps.reduce<Partial<Pick<JSONSchema, 'properties' | 'required'>>>((acc, prop) => {
						const accumulator = acc ?? { properties: {}, required: [] };

						const entityPropDecorator = this.findEntityPropDecorator(prop);
						const explicitType = entityPropDecorator.options?.type;
						const type = explicitType ?? prop.type;

						const isArray = Array.isArray(type);

						// traverse the json of the json schema that is explicitly passed in the decorator
						// This is useful to traverse and reflect complex classes nested in json schema keywords (like anyOf, allOf, oneOf)
						// e.g.
						// @entity.prop({ anyOf: [MyClassOne, MyClassTwo]  })
						const omitProps =
							typeof entityPropDecorator?.options?.required === 'boolean'
								? ['type', 'required']
								: ['type'];
						const extractedJsonSchema = transformEntityDefinitionSchema(
							omit(entityPropDecorator?.options ?? {}, omitProps),
							args => {
								let additionalSchemaProps: Partial<JSONSchema> = {};
								let hasAdditionalSchemaProps = false;

								if (args.schema.enum && typeof args.schema.enum === 'object') {
									const enmType =
										args.schema.type === 'number' || type.name === 'Number' ? 'number' : 'string';
									additionalSchemaProps = {};
									additionalSchemaProps.type = enmType;
									additionalSchemaProps.enum = Object.values(args.schema.enum).filter(
										v => typeof v === enmType
									) as Array<string | number>;
									hasAdditionalSchemaProps = true;
								}

								if (args.pointerPath === '') {
									return {
										path: '',
										value: omit({ ...args.schema, ...additionalSchemaProps }, ['properties'])
									};
								}

								if (typeof args.schema === 'function') {
									// this check allow to support recursive schemas, specified in oneOf, allOf or anyOf keywords
									if (args.schema === this.type) {
										return {
											path: args.pointerPath,
											value: { _$ref: this }
										};
									}
									const value = makeSchema(args.schema);

									return {
										path: args.pointerPath,
										value
									};
								}

								if (hasAdditionalSchemaProps || args.parentKeyword === 'properties') {
									return {
										path: args.pointerPath,
										value: { ...args.schema, ...additionalSchemaProps }
									};
								}

								return null;
							}
						);

						// passing false or null as the type value, will disable the automatic
						// detection of the type
						// e.g. e.g. @entity.prop({ type: false })
						const hasFalseOrNullType = explicitType === false || explicitType === null;

						let isRecursiveType = false;
						if ((isArray && type[0] === this.type) || type === this.type) {
							isRecursiveType = true;
						}

						// the type is 'explicit', when is explicitly passed as parameter to the @entity.prop decorator
						// e.g. @entity.prop({ type: String })
						const hasExplicitType = !hasFalseOrNullType && typeof explicitType !== 'undefined';

						// a constant type is a standard JSON schema type, like 'string', 'number', etc
						const hasConstType =
							!hasFalseOrNullType &&
							hasExplicitType &&
							!Array.isArray(explicitType) &&
							typeof entityPropDecorator.options?.type !== 'function';

						let generatedJsonSchema;
						if (hasFalseOrNullType) {
							generatedJsonSchema = {};
						} else if (isRecursiveType) {
							generatedJsonSchema = isArray ? { type: 'array', items: { _$ref: this } } : { _$ref: this };
						} else if (hasConstType) {
							generatedJsonSchema = { type: entityPropDecorator.options?.type };
						} else {
							generatedJsonSchema = makeSchema(entityPropDecorator.options?.type ?? prop.type, prop.name);
						}

						accumulator.properties[prop.name] = deepMerge(extractedJsonSchema, generatedJsonSchema ?? {}, {
							isMergeableObject: isPlainObject
						});

						if (
							entityPropDecorator.options?.required &&
							typeof entityPropDecorator.options?.required === 'boolean'
						) {
							accumulator.required.push(prop.name);
						}

						return accumulator;
					}, {}) ?? {};

				const jsonSchema: Partial<JSONSchema> = {
					title: entityDecorator?.options?.name ?? key ?? typeOrClass.name,
					type: 'object'
				};

				if (properties) {
					jsonSchema.properties = properties;
				}

				if (required) {
					jsonSchema.required = required;
				}

				if (entityDecorator) {
					jsonSchema.$id = jsonSchema.title;
				}

				return jsonSchema;
			}

			return null;
		};

		if (!this.type) {
			throw new Error('type not set');
		}

		return makeSchema(this.type) as EntityDefinitionJSONSchema;
	}

	private findEntityDecorator(reflection: ClassReflection): Maybe<{ [DecoratorId]: string; options: EntityOptions }> {
		return reflection.decorators.find(d => d[DecoratorId] === 'entity');
	}

	private filterEntityPropDecorators(reflection: ClassReflection): PropertyReflection[] {
		return reflection.properties.filter(this.findEntityPropDecorator);
	}

	private findEntityPropDecorator(reflection: PropertyReflection): EntityPropReflection {
		return reflection.decorators.find(d => d[DecoratorId] === 'entity.prop');
	}
}
