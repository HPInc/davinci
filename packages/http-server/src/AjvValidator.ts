/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import {
	di,
	EntityDefinition,
	EntityDefinitionJSONSchema,
	EntityRegistry,
	JSONSchema,
	mapSeries,
	omit,
	transformEntityDefinitionSchema
} from '@davinci/core';
import Ajv, { ErrorObject, Options, Plugin } from 'ajv';
import addFormats from 'ajv-formats';
import { TypeValue } from '@davinci/reflector';
import { ValidateFunction } from 'ajv/dist/types';
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
type AjvOptionsMap = Record<Source, Options>;

type AjvPluginOptions = unknown;
type AjvPlugin = Plugin<AjvPluginOptions>;
type AjvPlugins = Array<[AjvPlugin, AjvPluginOptions?]>;
type AjvPluginsMap = Record<Source, AjvPlugins>;

export interface AjvValidatorOptions {
	ajvOptions?: Options | Partial<AjvOptionsMap>;
	ajvPlugins?: AjvPlugins | Partial<AjvPluginsMap>;
}

@di.autoInjectable()
export class AjvValidator<Request = unknown> {
	private ajvInstances: Partial<AjvInstancesMap> = {};
	private jsonSchemasMap = new Map<TypeValue, JSONSchema | Partial<JSONSchema>>();
	private entityDefinitionJSONSchemaCache = new Map<TypeValue, EntityDefinitionJSONSchema>();

	private sourceToSchemaMap: Record<'path' | 'query' | 'header' | 'body', keyof EndpointSchema['properties']> = {
		path: 'params',
		query: 'querystring',
		header: 'headers',
		body: 'body'
	};

	constructor(private options?: AjvValidatorOptions, private entityRegistry?: EntityRegistry) {
		this.initializeInstances();
		this.registerPlugins();
	}

	public async createValidatorFunction(route: Route<Request>): Promise<ValidationFunction> {
		const { parametersConfig } = route;
		const endpointSchema = await this.createSchema(parametersConfig);

		const validateFns = sources.reduce<Array<{ source: Source; validateFn: ValidateFunction }>>((acc, source) => {
			const schema = endpointSchema.properties[this.sourceToSchemaMap[source]];

			if (schema) {
				const validateFn = this.ajvInstances[source]?.compile(schema);
				if (validateFn) {
					acc.push({
						source,
						validateFn
					});
				}
			}

			return acc;
		}, []);

		return async data => {
			const errors: Array<ErrorObject> = [];
			validateFns.forEach(({ source, validateFn }) => {
				const dataPath = data?.[this.sourceToSchemaMap[source]];
				if (!validateFn(dataPath)) {
					errors.push(...(validateFn.errors?.map(error => this.formatAjvError(source, error)) ?? []));
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

			const parameterConfigType = parameterConfig.type as TypeValue;

			const entityJsonSchema = this.entityRegistry?.getEntityDefinitionJsonSchema(
				parameterConfigType
			) as EntityDefinitionJSONSchema;
			const entityDefinition = this.entityRegistry?.getEntityDefinitionMap().get(parameterConfigType);

			const jsonSchema = this.jsonSchemasMap.get(parameterConfigType) ?? this.createJsonSchema(entityJsonSchema);
			if (
				entityDefinition &&
				!this.jsonSchemasMap.has(entityDefinition.getType() as TypeValue) &&
				jsonSchema.$id
			) {
				this.jsonSchemasMap.set(entityDefinition.getType() as TypeValue, jsonSchema);
				this.addSchemaToAjvInstances(jsonSchema);
			}

			if (['path', 'query', 'header'].includes(parameterConfig.source)) {
				const schemaProp = this.sourceToSchemaMap[parameterConfig.source];

				// eslint-disable-next-line no-multi-assign
				const schema = (endpointSchema.properties[schemaProp] = endpointSchema.properties[schemaProp] ?? {
					type: 'object',
					properties: {},
					required: []
				});
				schema.properties[parameterConfig.name] = enabledValidation ? jsonSchema : true;
				schema.required = schema.required ?? [];
				if (enabledValidation && parameterConfig.options?.required) {
					schema.required.push(parameterConfig.name);
				}
			}

			if (parameterConfig.source === 'body') {
				const jsonSchemaDef = jsonSchema?.$id ? { $ref: jsonSchema.$id } : jsonSchema;
				// @ts-ignore
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

	private formatAjvError(source: Source, error: ErrorObject) {
		const rootPath = this.sourceToSchemaMap[source];
		error.instancePath = error.instancePath.replace(/(^\/)|(^$)/, `/${rootPath}$1`);
		error.schemaPath = error.schemaPath.replace(/^#\/properties\//, `#/${rootPath}/properties/`);

		return error;
	}

	private initializeInstances() {
		sources.forEach(source => {
			const sourceOptions = (<Partial<AjvOptionsMap>>this.options?.ajvOptions)?.[source];
			const ajv = new Ajv({
				...defaultAjvOptions,
				...(sourceOptions ?? this.options?.ajvOptions)
			});
			this.ajvInstances[source] = addFormats(ajv);
		});
	}

	private isPluginsMap = (plugins: AjvPlugins | Partial<AjvPluginsMap>): plugins is AjvPluginsMap => {
		return !Array.isArray(plugins);
	};

	private registerPlugins() {
		const plugins = this.options?.ajvPlugins;
		if (!plugins) return;

		sources.forEach(source => {
			const ajvInstance = this.ajvInstances[source];
			if (!ajvInstance) return;

			if (this.isPluginsMap(plugins)) {
				// eslint-disable-next-line no-unused-expressions
				plugins[source]?.forEach(p => {
					const [plugin, opts] = p;
					plugin(ajvInstance, opts);
				});
			} else if (Array.isArray(plugins)) {
				plugins.forEach(p => {
					const [plugin, opts] = p;
					plugin(ajvInstance, opts);
				});
			}
		});
	}

	private addSchemaToAjvInstances(schema: Partial<JSONSchema>) {
		const completedAjvInstances = new Set();

		sources.forEach(source => {
			const ajv = this.ajvInstances[source];
			if (!ajv) return;

			if (!completedAjvInstances.has(ajv) && !ajv.getSchema(schema.$id ?? '')) {
				ajv.addSchema(schema);
				completedAjvInstances.add(ajv);
			}
		});
	}

	private createJsonSchema(entityJsonSchema: EntityDefinitionJSONSchema): Partial<JSONSchema> {
		return transformEntityDefinitionSchema(entityJsonSchema, args => {
			if (args.pointerPath === '') {
				return { path: '', value: omit(args.schema, ['properties']) };
			}

			if (args.schema._$ref) {
				const ref: EntityDefinition = args.schema._$ref;

				// if the entity definition was previously evaluated, return the $ref
				const refType = ref.getType() as TypeValue;
				if (this.entityDefinitionJSONSchemaCache.has(refType)) {
					const childEntityDefJsonSchema = this.entityDefinitionJSONSchemaCache.get(refType);
					return { path: args.pointerPath, value: { $ref: childEntityDefJsonSchema?.$id } };
				}

				const entityDefinitionJsonSchema = ref.getEntityDefinitionJsonSchema();
				this.entityDefinitionJSONSchemaCache.set(refType, entityDefinitionJsonSchema);

				const childEntityDefJsonSchema = this.createJsonSchema(entityDefinitionJsonSchema);
				if (childEntityDefJsonSchema.$id) {
					if (!this.jsonSchemasMap.has(refType)) {
						this.jsonSchemasMap.set(refType, childEntityDefJsonSchema);
						this.addSchemaToAjvInstances(childEntityDefJsonSchema);
					}
					return { path: args.pointerPath, value: { $ref: childEntityDefJsonSchema.$id } };
				}
				return { path: args.pointerPath, value: childEntityDefJsonSchema };
			}

			if (args.parentKeyword === 'properties') {
				return { path: args.pointerPath, value: args.schema };
			}

			return null;
		});
	}
}

export const createAjvValidator = (options?: AjvValidatorOptions): ValidationFactory => {
	const ajvValidator = new AjvValidator(options);

	return route => ajvValidator.createValidatorFunction(route);
};
