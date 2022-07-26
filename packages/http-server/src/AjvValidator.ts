/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { EntityRegistry, JSONSchema, mapObject, mapSeries } from '@davinci/core';
import Ajv, { Options } from 'ajv';
import addFormats from 'ajv-formats';
import { BadRequest } from './httpErrors';

import { Verb } from './decorators';
import { EndpointValidationSchema, ParameterConfiguration } from './types';

export interface AjvValidatorOptions {
	ajvOptions?: Options;
	plugins?: [];
}

export class AjvValidator<Request = unknown> {
	ajv: Ajv;
	entitiesMap = new Map<string, JSONSchema>();

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

	async createSchema(parametersConfig: ParameterConfiguration<Request>[]): Promise<EndpointValidationSchema> {
		const endpointSchema: EndpointValidationSchema = {
			type: 'object',
			properties: {},
			required: []
		};

		await mapSeries(parametersConfig, parameterConfig => {
			if (parameterConfig.source === 'context') return;

			const createJsonSchema = (jsonSchema: JSONSchema) => {
				if (typeof jsonSchema === 'object') {
					return {
						...(jsonSchema.title ? { $id: jsonSchema.title } : {}),
						...mapObject<JSONSchema>(jsonSchema, (p, key) => {
							if (key === 'properties' && p) {
								return mapObject(p, propValue => {
									if (propValue._$ref) {
										const refEntityDefinitionJson = createJsonSchema(
											this.entitiesMap.get(propValue._$ref) ?? propValue._$ref?.getJsonSchema()
										);

										if (!this.entitiesMap.has(propValue._$ref)) {
											this.entitiesMap.set(propValue._$ref, refEntityDefinitionJson);
											if (refEntityDefinitionJson?.$id) {
												this.ajv.addSchema(refEntityDefinitionJson);
												return { $ref: refEntityDefinitionJson.$id };
											}
										}

										return refEntityDefinitionJson;
									}

									return propValue;
								});
							}

							return p;
						})
					};
				}

				return jsonSchema;
			};

			const entityDefinition = this.entityRegistry.getEntityDefinitionMap().get(parameterConfig.type);

			const jsonSchema =
				this.entitiesMap.get(entityDefinition.getJsonSchema().title) ??
				createJsonSchema(entityDefinition.getJsonSchema());
			if (!this.entitiesMap.has(entityDefinition.getJsonSchema().title) && jsonSchema.$id) {
				this.entitiesMap.set(jsonSchema.$id, jsonSchema);
				this.ajv.addSchema(jsonSchema);
			}

			const sourceToSchemaMap: Partial<
				Record<ParameterConfiguration<Request>['source'], keyof EndpointValidationSchema['properties']>
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
				endpointSchema.properties.body = { type: jsonSchema.type, $ref: jsonSchema.$id };
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
}
