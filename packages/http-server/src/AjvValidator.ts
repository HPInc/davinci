/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { EntityRegistry, JSONSchema, mapObject, mapSeries } from '@davinci/core';
import Ajv, { Options } from 'ajv';
import addFormats from 'ajv-formats';
import { TypeValue } from '@davinci/reflector';
import { BadRequest } from './httpErrors';

import { Verb } from './decorators';
import { EndpointSchema, ParameterConfiguration } from './types';

export interface AjvValidatorOptions {
	ajvOptions?: Options;
	plugins?: [];
}

export class AjvValidator<Request = unknown> {
	ajv: Ajv;
	jsonSchemasMap = new Map<TypeValue, JSONSchema>();

	constructor(options: AjvValidatorOptions, private entityRegistry: EntityRegistry) {
		this.ajv = new Ajv({
			removeAdditional: 'all',
			coerceTypes: 'array',
			allErrors: true,
			useDefaults: true,
			...options?.ajvOptions
		});
		addFormats(this.ajv);
	}

	public async createValidatorFunction({
		parametersConfig
	}: {
		verb?: Verb;
		path?: string;
		parametersConfig: ParameterConfiguration<Request>[];
	}): Promise<(data: unknown) => Promise<void>> {
		const endpointSchema = await this.createSchema(parametersConfig);
		const validate = this.ajv.compile(endpointSchema);

		return async (data: unknown) => {
			if (!validate(data)) {
				throw new BadRequest('Validation error', { errors: validate.errors });
			}
		};
	}

	async createSchema(parametersConfig: ParameterConfiguration<Request>[]): Promise<EndpointSchema> {
		const endpointSchema: EndpointSchema = {
			type: 'object',
			properties: {},
			required: []
		};

		await mapSeries(parametersConfig, parameterConfig => {
			if (
				parameterConfig.source === 'context' ||
				parameterConfig.source === 'request' ||
				parameterConfig.source === 'response'
			)
				return;

			const entityJsonSchema = this.entityRegistry.getJsonSchema(parameterConfig.type);
			const entityDefinition = this.entityRegistry.getEntityDefinitionMap().get(parameterConfig.type);

			const jsonSchema = this.jsonSchemasMap.get(parameterConfig.type) ?? this.createJsonSchema(entityJsonSchema);
			if (!this.jsonSchemasMap.has(entityDefinition) && jsonSchema.$id) {
				this.jsonSchemasMap.set(entityDefinition, jsonSchema);
				this.ajv.addSchema(jsonSchema);
			}

			const sourceToSchemaMap: Partial<
				Record<ParameterConfiguration<Request>['source'], keyof EndpointSchema['properties']>
			> = {
				path: 'params',
				query: 'querystring',
				header: 'headers'
			};

			if (['path', 'query', 'header'].includes(parameterConfig.source)) {
				const schemaProp = sourceToSchemaMap[parameterConfig.source];

				endpointSchema.properties[schemaProp] = endpointSchema.properties[schemaProp] ?? {
					type: 'object',
					properties: {},
					required: undefined
				};
				endpointSchema.properties[schemaProp].properties[parameterConfig.name] = jsonSchema;
				endpointSchema.properties[schemaProp].required = endpointSchema.properties[schemaProp].required ?? [];
				if (parameterConfig.options?.required) {
					endpointSchema.properties[schemaProp].required.push(parameterConfig.name);
				}
			}

			if (parameterConfig.source === 'body') {
				endpointSchema.properties.body = jsonSchema?.$id ? { $ref: jsonSchema.$id } : jsonSchema;
				endpointSchema.required = endpointSchema.required ?? [];
				if (parameterConfig.options?.required) {
					endpointSchema.required.push('body');
				}
			}
		});

		return endpointSchema;
	}

	public getAjvSchema(key: string) {
		return this.ajv.getSchema(key);
	}

	private createJsonSchema(jsonSchema: Partial<JSONSchema>) {
		return {
			...(jsonSchema.title ? { $id: jsonSchema.title } : {}),
			...mapObject<Partial<JSONSchema>>(jsonSchema, (p, key) => {
				if (key === 'properties' && p) {
					return mapObject(p, propValue => {
						if (propValue._$ref) {
							const refEntityDefinitionJson = this.createJsonSchema(
								this.jsonSchemasMap.get(propValue._$ref) ?? propValue._$ref?.getJsonSchema()
							);

							if (!this.jsonSchemasMap.has(propValue._$ref)) {
								this.jsonSchemasMap.set(propValue._$ref, refEntityDefinitionJson);
								this.ajv.addSchema(refEntityDefinitionJson);
							}

							return { $ref: refEntityDefinitionJson.$id };
						}

						if (propValue.type === 'array' && propValue.items?._$ref) {
							const $ref = propValue.items?._$ref;
							const refEntityDefinitionJson = this.createJsonSchema(
								this.jsonSchemasMap.get($ref) ?? $ref?.getJsonSchema()
							);

							if (!this.jsonSchemasMap.has($ref)) {
								this.jsonSchemasMap.set($ref, refEntityDefinitionJson);
								this.ajv.addSchema(refEntityDefinitionJson);
							}

							return { ...propValue, items: { $ref: refEntityDefinitionJson.$id } };
						}

						return propValue;
					});
				}

				if (key === 'items' && p._$ref) {
					const $ref = p._$ref;
					const refEntityDefinitionJson = this.createJsonSchema(
						this.jsonSchemasMap.get($ref) ?? $ref?.getJsonSchema()
					);

					if (!this.jsonSchemasMap.has($ref)) {
						this.jsonSchemasMap.set($ref, refEntityDefinitionJson);
						this.ajv.addSchema(refEntityDefinitionJson);
					}

					return { $ref: refEntityDefinitionJson.$id };
				}

				return p;
			})
		};
	}
}
