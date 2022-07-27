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
import { EntityOptions, EntityPropReflection, JSONSchema } from './types';

interface EntityDefinitionOptions {
	name?: string;
	type?: TypeValue;
	jsonSchema?: JSONSchema;
	// eslint-disable-next-line no-use-before-define
	entityDefinitionsMapCache?: Map<TypeValue, EntityDefinition>;
}

export class EntityDefinition {
	private readonly name?: string;
	private readonly type?: TypeValue;
	private readonly jsonSchema?: JSONSchema;
	private relatedEntityDefinitionsMap = new Map<TypeValue, EntityDefinition>();
	private entityDefinitionsMapCache = new Map<TypeValue, EntityDefinition>();

	constructor(options: EntityDefinitionOptions) {
		if (!options.type && !options.jsonSchema) {
			throw new Error('type or jsonSchema must be passed');
		}
		this.name = options.name ?? this.type?.constructor?.name;
		this.type = options.type;
		this.entityDefinitionsMapCache = options.entityDefinitionsMapCache;
		this.jsonSchema = this.reflect(/* options.jsonSchema */);
	}

	public getRelatedEntityDefinitionsMap() {
		return this.relatedEntityDefinitionsMap;
	}

	public setRelatedEntityDefinitionsMap(map: Map<TypeValue, EntityDefinition>) {
		this.relatedEntityDefinitionsMap = map;
	}

	public getName() {
		return this.name;
	}

	public getJsonSchema() {
		return this.jsonSchema;
	}

	private reflect(/* jsonSchema?: JSONSchema */) {
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

				if (entityDecorator && this.type !== typeOrClass) {
					const theClass = <TypeValue>typeOrClass;

					if (this.entityDefinitionsMapCache?.has(theClass)) {
						const entityDefinition = this.entityDefinitionsMapCache?.get(theClass);
						this.relatedEntityDefinitionsMap.set(theClass, entityDefinition);

						return {
							_$ref: this.relatedEntityDefinitionsMap.get(theClass)
						};
					}

					// check if the class has been already added to the related entity definitions map
					if (this.relatedEntityDefinitionsMap.has(theClass)) {
						return {
							_$ref: this.relatedEntityDefinitionsMap.get(theClass)
						};
					}
					const entityDefinition = new EntityDefinition({ type: theClass });
					this.relatedEntityDefinitionsMap.set(theClass, entityDefinition);

					return {
						_$ref: entityDefinition
					};
				}

				const entityProps = this.filterEntityPropDecorators(reflection);
				const { properties, required } =
					entityProps.reduce<Partial<Pick<JSONSchema, 'properties' | 'required'>>>((acc, prop) => {
						const accumulator = acc ?? { properties: {}, required: [] };

						const entityPropDecorator = this.findEntityPropDecorator(prop);
						accumulator.properties[prop.name] = makeSchema(
							entityPropDecorator.options?.type ?? prop.type,
							prop.name
						);
						if (entityPropDecorator.options?.required) {
							accumulator.required.push(prop.name);
						}

						return accumulator;
					}, null) ?? {};

				const jsonSchema: JSONSchema = {
					title: entityDecorator?.options?.title ?? key ?? typeOrClass.name,
					type: 'object',
					properties,
					required
				};

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
