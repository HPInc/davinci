/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { di, EntityRegistry, JSONSchema, mapObject, mapSeries } from '@davinci/core';
import Ajv, { DefinedError, Options } from 'ajv';
import addFormats from 'ajv-formats';
import { TypeValue } from '@davinci/reflector';
import { EndpointSchema, ParameterConfiguration, Route, ValidationFactory, ValidationFunction } from './types';
import { BadRequest } from './httpErrors';

const defaultAjvOptions: Options = {
	removeAdditional: 'all',
	coerceTypes: 'array',
	allErrors: true,
	useDefaults: true
};

const sources = ['path', 'header', 'query', 'body'] as const;
type Source = typeof sources[number];
type AjvInstancesMap = Record<Source, Ajv>;

type AjvPlugin = Function;
type AjvPluginOptions = unknown;

export interface AjvValidatorOptions {
	ajvOptions?: Options;
	plugins?: Array<[AjvPlugin, AjvPluginOptions?]>;
	instances?: Ajv | Partial<AjvInstancesMap>;
}

@di.autoInjectable()
export class AjvValidator<Request = unknown> {
	private ajvInstances?: Partial<AjvInstancesMap>;
	private jsonSchemasMap = new Map<TypeValue, JSONSchema>();

	private sourceToSchemaMap: Partial<
		Record<ParameterConfiguration<Request>['source'], keyof EndpointSchema['properties']>
	> = {
		path: 'params',
		query: 'querystring',
		header: 'headers',
		body: 'body'
	};

	constructor(private options: AjvValidatorOptions, private entityRegistry?: EntityRegistry) {
		this.initializeInstances();
	}

	public async createValidatorFunction(route: Route<Request>): Promise<ValidationFunction> {
		const { parametersConfig } = route;
		const endpointSchema = await this.createSchema(parametersConfig);

		const validateFns = sources.reduce((acc, source) => {
			const schema = endpointSchema.properties[this.sourceToSchemaMap[source]];
			if (schema) {
				const validateFn = this.ajvInstances[source].compile(schema);
				acc.push({
					source,
					validateFn
				});
			}

			return acc;
		}, []);

		return async (data: unknown) => {
			const errors = [];
			validateFns.forEach(({ source, validateFn }) => {
				const dataPath = data?.[this.sourceToSchemaMap[source]];
				if (!validateFn(dataPath)) {
					errors.push(...validateFn.errors.map(error => this.formatAjvError(source, error)));
				}
			});

			if (errors.length) {
				throw new BadRequest('Validation error', {
					errors
				});
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

			const enabledValidation = !parameterConfig.options?.validation?.disabled;

			const entityJsonSchema = this.entityRegistry.getJsonSchema(parameterConfig.type);
			const entityDefinition = this.entityRegistry.getEntityDefinitionMap().get(parameterConfig.type);

			const jsonSchema = this.jsonSchemasMap.get(parameterConfig.type) ?? this.createJsonSchema(entityJsonSchema);
			if (!this.jsonSchemasMap.has(entityDefinition) && jsonSchema.$id) {
				this.jsonSchemasMap.set(entityDefinition, jsonSchema);
				this.addSchemaToAjvInstances(jsonSchema);
			}

			if (['path', 'query', 'header'].includes(parameterConfig.source)) {
				const schemaProp = this.sourceToSchemaMap[parameterConfig.source];

				endpointSchema.properties[schemaProp] = endpointSchema.properties[schemaProp] ?? {
					type: 'object',
					properties: {},
					required: undefined
				};
				endpointSchema.properties[schemaProp].properties[parameterConfig.name] = enabledValidation
					? jsonSchema
					: true;
				endpointSchema.properties[schemaProp].required = endpointSchema.properties[schemaProp].required ?? [];
				if (enabledValidation && parameterConfig.options?.required) {
					endpointSchema.properties[schemaProp].required.push(parameterConfig.name);
				}
			}

			if (parameterConfig.source === 'body') {
				const jsonSchemaDef = jsonSchema?.$id ? { $ref: jsonSchema.$id } : jsonSchema;
				endpointSchema.properties.body = enabledValidation ? jsonSchemaDef : true;
				endpointSchema.required = endpointSchema.required ?? [];
				if (enabledValidation && parameterConfig.options?.required) {
					endpointSchema.required.push('body');
				}
			}
		});

		return endpointSchema;
	}

	public getAjvInstances() {
		return this.ajvInstances;
	}

	public getOptions() {
		return this.options;
	}

	private formatAjvError(source: Source, error: DefinedError) {
		const rootPath = this.sourceToSchemaMap[source];
		error.instancePath = error.instancePath.replace(/(^\/)|(^$)/, `/${rootPath}$1`);
		error.schemaPath = error.schemaPath.replace(/^#\/properties\//, `#/${rootPath}/properties/`);

		return error;
	}

	private initializeInstances() {
		const ajvInstances = this.options?.instances;

		if (ajvInstances instanceof Ajv || ajvInstances?.constructor?.name === 'Ajv') {
			const ajv = ajvInstances as Ajv;
			this.ajvInstances = {
				body: ajv,
				query: ajv,
				path: ajv,
				header: ajv
			};
		} else if (typeof ajvInstances === 'object' || !ajvInstances) {
			const ajv = new Ajv({
				...defaultAjvOptions,
				...this.options?.ajvOptions
			});
			addFormats(ajv);

			this.ajvInstances = sources.reduce(
				(acc: AjvInstancesMap, source) => ({
					...acc,
					[source]: acc?.[source] ?? ajv
				}),
				ajvInstances
			);
		}
	}

	private addSchemaToAjvInstances(schema: Partial<JSONSchema>) {
		const completedAjvInstances = new Set();

		sources.forEach(source => {
			const ajv = this.ajvInstances[source];
			if (!completedAjvInstances.has(ajv) && !ajv.getSchema(schema.$id)) {
				ajv.addSchema(schema);
				completedAjvInstances.add(ajv);
			}
		});
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
								this.addSchemaToAjvInstances(refEntityDefinitionJson);
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
								this.addSchemaToAjvInstances(refEntityDefinitionJson);
							}

							return { ...propValue, items: { $ref: refEntityDefinitionJson.$id } };
						}

						const additionalProps = ['allOf', 'anyOf', 'oneOf'].reduce((acc, key) => {
							if (propValue[key]) {
								acc[key] = propValue[key].map(s => {
									const $ref = s?._$ref;
									if (!$ref) {
										return s;
									}

									const refEntityDefinitionJson = this.createJsonSchema(
										this.jsonSchemasMap.get($ref) ?? $ref?.getJsonSchema()
									);

									if (!this.jsonSchemasMap.has($ref)) {
										this.jsonSchemasMap.set($ref, refEntityDefinitionJson);
										this.addSchemaToAjvInstances(refEntityDefinitionJson);
									}

									return { $ref: refEntityDefinitionJson.$id };
								});
							}

							return acc;
						}, {});

						return { ...propValue, ...additionalProps };
					});
				}

				if (key === 'items' && p._$ref) {
					const $ref = p._$ref;
					const refEntityDefinitionJson = this.createJsonSchema(
						this.jsonSchemasMap.get($ref) ?? $ref?.getJsonSchema()
					);

					if (!this.jsonSchemasMap.has($ref)) {
						this.jsonSchemasMap.set($ref, refEntityDefinitionJson);
						this.addSchemaToAjvInstances(refEntityDefinitionJson);
					}

					return { $ref: refEntityDefinitionJson.$id };
				}

				return p;
			})
		};
	}
}

export const createAjvValidator = (options?: AjvValidatorOptions): ValidationFactory => {
	const ajvValidator = new AjvValidator(options);

	return route => ajvValidator.createValidatorFunction(route);
};
