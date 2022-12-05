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

interface EntityDefinitionOptions {
	name?: string;
	type?: TypeValue;
	jsonSchema?: JSONSchema;
	// eslint-disable-next-line no-use-before-define
	entityDefinitionsMapCache?: Map<TypeValue, EntityDefinition>;
}

export class EntityDefinition {
	private name?: string;
	private readonly type?: TypeValue;
	private readonly entityDefinitionJsonSchema?: EntityDefinitionJSONSchema;
	private entityDefinitionsMapCache = new Map<TypeValue, EntityDefinition>();

	constructor(options: EntityDefinitionOptions) {
		if (!options.type && !options.jsonSchema) {
			throw new Error('type or entityDefinitionJsonSchema must be passed');
		}
		this.type = options.type;
		this.name = options.name ?? (this.type as ClassType)?.name;
		this.entityDefinitionsMapCache = options.entityDefinitionsMapCache;
		this.entityDefinitionJsonSchema = this.reflect();
	}

	public getName() {
		return this.name;
	}

	public getEntityDefinitionJsonSchema() {
		return this.entityDefinitionJsonSchema;
	}

	public getType() {
		return this.type;
	}

	private reflect(/* entityDefinitionJsonSchema?: JSONSchema */): EntityDefinitionJSONSchema {
		const makeSchema = (
			typeOrClass: TypeValue | StringConstructor | NumberConstructor | BooleanConstructor | Date,
			key?: string
		) => {
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
						entityDefinitionsMapCache: this.entityDefinitionsMapCache
					});
					// eslint-disable-next-line no-unused-expressions
					this.entityDefinitionsMapCache?.set(theClass, entityDefinition);

					return {
						_$ref: entityDefinition
					};
				}

				const entityProps = this.filterEntityPropDecorators(reflection);
				const { properties, required } =
					entityProps.reduce<Partial<Pick<JSONSchema, 'properties' | 'required'>>>((acc, prop) => {
						const accumulator = acc ?? { properties: {}, required: [] };

						const entityPropDecorator = this.findEntityPropDecorator(prop);
						const extractedJsonSchema = omit(entityPropDecorator?.options ?? {}, ['type', 'required']);

						const hasConstType =
							entityPropDecorator.options?.type &&
							!Array.isArray(entityPropDecorator.options?.type) &&
							typeof entityPropDecorator.options?.type !== 'function';

						const generatedJsonSchema = hasConstType
							? { type: entityPropDecorator.options?.type }
							: makeSchema(entityPropDecorator.options?.type ?? prop.type, prop.name);

						accumulator.properties[prop.name] = deepMerge(extractedJsonSchema, generatedJsonSchema, {
							isMergeableObject: isPlainObject
						});

						if (entityPropDecorator.options?.required) {
							accumulator.required.push(prop.name);
						}

						return accumulator;
					}, null) ?? {};

				const jsonSchema: JSONSchema = {
					title: entityDecorator?.options?.name ?? key ?? typeOrClass.name,
					type: 'object',
					properties,
					required
				};

				if (entityDecorator) {
					jsonSchema.$id = jsonSchema.title;
				}

				return jsonSchema;
			}

			return null;
		};

		return makeSchema(this.type);
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
