/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { App, EntityRegistry, JSONSchema, mapObject, mapSeries, Module } from '@davinci/core';
import type { HttpServerModule, Route } from '@davinci/http-server';
import http, { Server } from 'http';
import pino from 'pino';
import { OpenAPIV3 } from 'openapi-types';
import createDeepMerge from '@fastify/deepmerge';

const deepMerge = createDeepMerge();

export interface OpenAPIModuleOptions {
	document: Omit<OpenAPIV3.Document, 'paths' | 'openapi'>;
}

type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
	  }
	: T;

export class OpenAPIModule extends Module {
	app: App;
	jsonSchemasMap = new Map<string, JSONSchema>();
	logger = pino({ name: 'openAPI-module' });
	httpServer: Server;
	entityRegistry: EntityRegistry;
	openAPIDoc: DeepPartial<OpenAPIV3.Document>;

	constructor(protected moduleOptions: OpenAPIModuleOptions) {
		super();
		this.openAPIDoc = deepMerge(
			{
				openapi: '3.0.0',
				components: {
					schemas: {}
				},
				paths: {}
			},
			this.moduleOptions.document
		);
	}

	getModuleId() {
		return 'openapi';
	}

	async onInit(app: App) {
		this.app = app;
		const httpServerModule = await app.getModuleById<HttpServerModule<unknown, unknown, Server>>('http', true);
		this.httpServer = httpServerModule?.getHttpServer() ?? http.createServer();
		this.entityRegistry = httpServerModule.getEntityRegistry();
		const routes = httpServerModule.getRoutes();

		await mapSeries(routes, route => this.createPathAndSchema(route));
	}

	async createPathAndSchema(route: Route<unknown>): Promise<void> {
		const { path, verb, parametersConfig, methodDecoratorMetadata } = route;
		await mapSeries(parametersConfig, parameterConfig => {
			if (parameterConfig.source === 'context') return;

			const createJsonSchema = (jsonSchema: Partial<JSONSchema>) => {
				if (typeof jsonSchema === 'object') {
					return {
						...(jsonSchema.title ? { $id: jsonSchema.title } : {}),
						...mapObject<Partial<JSONSchema>>(jsonSchema, (p, key) => {
							if (key === 'properties' && p) {
								return mapObject(p, propValue => {
									if (propValue._$ref) {
										const refEntityDefinitionJson = createJsonSchema(
											this.jsonSchemasMap.get(propValue._$ref) ?? propValue._$ref?.getJsonSchema()
										);

										if (!this.jsonSchemasMap.has(propValue._$ref)) {
											this.jsonSchemasMap.set(propValue._$ref, refEntityDefinitionJson);
										}

										if (refEntityDefinitionJson?.$id) {
											this.openAPIDoc.components.schemas[refEntityDefinitionJson.$id] =
												refEntityDefinitionJson;
											return { $ref: `#/components/schemas/${refEntityDefinitionJson.$id}` };
										}

										return refEntityDefinitionJson;
									}

									if (propValue.type === 'array' && propValue.items?._$ref) {
										const $ref = propValue.items?._$ref;
										const refEntityDefinitionJson = createJsonSchema(
											this.jsonSchemasMap.get($ref) ?? $ref?.getJsonSchema()
										);

										if (!this.jsonSchemasMap.has($ref)) {
											this.jsonSchemasMap.set($ref, refEntityDefinitionJson);
										}

										if (refEntityDefinitionJson?.$id) {
											this.openAPIDoc.components.schemas[refEntityDefinitionJson.$id] =
												refEntityDefinitionJson;
											return {
												...propValue,
												items: {
													$ref: `#/components/schemas/${refEntityDefinitionJson.$id}`
												}
											};
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

			const entityJsonSchema = this.entityRegistry.getJsonSchema(parameterConfig.type);

			const jsonSchema = this.jsonSchemasMap.get(entityJsonSchema.title) ?? createJsonSchema(entityJsonSchema);
			if (!this.jsonSchemasMap.has(entityJsonSchema.title) && jsonSchema.$id) {
				this.jsonSchemasMap.set(jsonSchema.$id, jsonSchema);
				this.openAPIDoc.components.schemas[jsonSchema.$id] = jsonSchema;
			}

			this.openAPIDoc.paths[path] = this.openAPIDoc.paths[path] ?? {};
			this.openAPIDoc.paths[path][verb] = {
				...(methodDecoratorMetadata.options?.summary && { summary: methodDecoratorMetadata.options?.summary }),
				...(methodDecoratorMetadata.options?.description && {
					description: methodDecoratorMetadata.options?.description
				})
			};

			if (['path', 'query', 'header'].includes(parameterConfig.source)) {
				this.openAPIDoc.paths[path][verb].parameters = this.openAPIDoc.paths[path][verb].parameters ?? [];
				this.openAPIDoc.paths[path][verb].parameters.push({
					name: parameterConfig.name,
					...(parameterConfig.options?.description && { description: parameterConfig.options?.description }),
					in: parameterConfig.source,
					schema: jsonSchema?.$id ? { $ref: `#/components/schemas/${jsonSchema.$id}` } : jsonSchema,
					...(parameterConfig.options?.required && { required: parameterConfig.options?.required })
				});
			}

			if (parameterConfig.source === 'body') {
				this.openAPIDoc.paths[path][verb].requestBody = {
					...(parameterConfig.options?.description && { description: parameterConfig.options?.description }),
					...(parameterConfig.options?.required && { required: parameterConfig.options?.required }),
					content: {
						'application/json': {
							schema: jsonSchema?.$id ? { $ref: `#/components/schemas/${jsonSchema.$id}` } : jsonSchema
						}
					}
				};
			}
		});
	}

	getOpenAPIDocument() {
		return this.openAPIDoc;
	}
}
