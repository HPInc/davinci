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
import { ClassType } from '@davinci/reflector';
import { generateSwaggerUiHtml } from './swaggerUi';

const deepMerge = createDeepMerge();

export interface OpenAPIModuleOptions {
	document: {
		enabled?: boolean;
		path?: string;
		spec: Omit<OpenAPIV3.Document, 'paths' | 'openapi'>;
	};
	explorer?: {
		enabled?: boolean;
		path?: string;
	};
}

type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
	  }
	: T;

export class OpenAPIModule extends Module {
	app: App;
	moduleOptions: OpenAPIModuleOptions;
	jsonSchemasMap = new Map<string, Partial<JSONSchema>>();
	logger = pino({ name: 'openAPI-module' });
	httpServerModule: HttpServerModule<unknown, unknown, Server>;
	httpServer: Server;
	entityRegistry: EntityRegistry;
	openAPIDoc: DeepPartial<OpenAPIV3.Document>;

	constructor(moduleOptions: OpenAPIModuleOptions) {
		super();
		this.moduleOptions = deepMerge(
			{
				document: {
					enabled: true,
					path: '/api-doc.json',
					spec: {
						openapi: '3.0.0',
						components: {
							schemas: {}
						},
						paths: {}
					}
				},
				explorer: {
					enabled: true,
					path: '/explorer'
				}
			},
			moduleOptions
		);
		this.openAPIDoc = this.moduleOptions.document?.spec;
	}

	getModuleId() {
		return 'openapi';
	}

	async onRegister(app: App) {
		this.app = app;
		this.httpServerModule = await app.getModuleById<HttpServerModule<unknown, unknown, Server>>(
			'http',
			'registered'
		);
		this.httpServer = this.httpServerModule?.getHttpServer() ?? http.createServer();
		this.entityRegistry = this.httpServerModule.getEntityRegistry();
		const routes = this.httpServerModule.getRoutes();

		await mapSeries(routes, route => this.createPathAndSchema(route));

		await this.registerOpenapiRoutes();
	}

	async createPathAndSchema(route: Route<unknown>): Promise<void> {
		const { path, verb, parametersConfig, methodDecoratorMetadata } = route;

		// Parameters handling
		await mapSeries(parametersConfig, parameterConfig => {
			if (
				parameterConfig.source === 'context' ||
				parameterConfig.source === 'request' ||
				parameterConfig.source === 'response'
			)
				return;

			const entityJsonSchema = this.entityRegistry.getJsonSchema(parameterConfig.type);

			const jsonSchema =
				this.jsonSchemasMap.get(entityJsonSchema.title) ?? this.createJsonSchema(entityJsonSchema);
			if (!this.jsonSchemasMap.has(entityJsonSchema.title) && jsonSchema.$id) {
				this.jsonSchemasMap.set(jsonSchema.$id, jsonSchema);
				this.openAPIDoc.components.schemas[jsonSchema.$id] = jsonSchema;
			}

			this.openAPIDoc.paths[path] = this.openAPIDoc.paths[path] ?? {};
			this.openAPIDoc.paths[path][verb] = {
				...(methodDecoratorMetadata.options?.summary && { summary: methodDecoratorMetadata.options?.summary }),
				...(methodDecoratorMetadata.options?.description && {
					description: methodDecoratorMetadata.options?.description
				}),
				...this.openAPIDoc.paths[path][verb]
			};

			if (['path', 'query', 'header'].includes(parameterConfig.source)) {
				this.openAPIDoc.paths[path][verb].parameters = this.openAPIDoc.paths[path][verb].parameters ?? [];
				this.openAPIDoc.paths[path][verb].parameters.push({
					name: parameterConfig.name,
					...(parameterConfig.options?.description && { description: parameterConfig.options?.description }),
					in: parameterConfig.source,
					schema: jsonSchema?.$id
						? {
								type: 'object',
								properties: {
									[parameterConfig.name]: { $ref: `#/components/schemas/${jsonSchema.$id}` }
								}
						  }
						: jsonSchema,
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

		// Responses handling
		await mapObject(methodDecoratorMetadata.options?.responses ?? {}, async (response, statusCode) => {
			let formattedResponse: OpenAPIV3.ResponseObject;

			// Case: ClassType passed at status code level
			// example: { responses: { 200: Customer }} OR { responses: { 200: [Customer] }}
			if (Array.isArray(response) || typeof response === 'function') {
				const singleItem = (Array.isArray(response) ? response[0] : response) as ClassType;
				const jsonSchema = this.getAndSetJsonSchema(singleItem);

				const description = jsonSchema.description ?? jsonSchema.title ?? '';
				formattedResponse = {
					description,
					content: {
						'application/json': {
							schema: this.generateArrayOrSingleDefinition(jsonSchema, Array.isArray(response))
						}
					}
				};
			}
			// Case: ClassType passed at response content level
			// example: { responses: { 200: { content: Customer }}} OR { responses: { 200: { content: [Customer] }}}
			else if (Array.isArray(response.content) || typeof response.content === 'function') {
				const singleItem = Array.isArray(response.content) ? response.content[0] : response.content;
				const jsonSchema = this.getAndSetJsonSchema(singleItem);

				const description = jsonSchema.description ?? jsonSchema.title ?? '';

				formattedResponse = {
					description,
					...response,
					content: {
						'application/json': {
							schema: this.generateArrayOrSingleDefinition(jsonSchema, Array.isArray(response.content))
						}
					}
				};
			} else if (typeof response.content === 'object') {
				await mapObject(
					response.content,
					(mediaTypeObject: OpenAPIV3.MediaTypeObject | ClassType | Array<ClassType>, contentType) => {
						// Case: ClassType passed at response content type level
						// example:
						// { responses: { 200: { content: { 'application/json': Customer }}}} OR
						// { responses: { 200: { content: { 'application/json': [Customer] }}}}
						if (Array.isArray(mediaTypeObject) || typeof mediaTypeObject === 'function') {
							const singleItem = Array.isArray(mediaTypeObject) ? mediaTypeObject[0] : mediaTypeObject;
							const jsonSchema = this.getAndSetJsonSchema(singleItem);

							formattedResponse = {
								...response,
								content: {
									...formattedResponse?.content,
									[contentType]: {
										schema: this.generateArrayOrSingleDefinition(
											jsonSchema,
											Array.isArray(mediaTypeObject)
										)
									}
								}
							};
						}
						// Case: ClassType passed at response content type schema level
						// example:
						// { responses: { 200: { content: { 'application/json': { schema: Customer }}}}} OR
						// { responses: { 200: { content: { 'application/json': { schema: [Customer] }}}}}
						else if (
							Array.isArray(mediaTypeObject.schema) ||
							typeof mediaTypeObject.schema === 'function'
						) {
							const singleItem = Array.isArray(mediaTypeObject.schema)
								? mediaTypeObject.schema[0]
								: mediaTypeObject.schema;
							const jsonSchema = this.getAndSetJsonSchema(singleItem);

							const description = jsonSchema.description ?? jsonSchema.title ?? '';
							formattedResponse = {
								description,
								...response,
								content: {
									...formattedResponse?.content,
									[contentType]: {
										...response?.content?.[contentType],
										schema: this.generateArrayOrSingleDefinition(
											jsonSchema,
											Array.isArray(mediaTypeObject.schema)
										)
									}
								}
							};
						}
						// Case: explicit object definition
						// example:
						// { responses: { 200: { content: { 'application/json': { schema: { type: 'object' }}}}}} OR
						// { responses: { 200: { content: { 'application/json': { schema: { type: 'array', items: { type: 'object' }}}}}}}
						else if (typeof mediaTypeObject.schema === 'object') {
							formattedResponse = {
								...response,
								content: {
									...formattedResponse?.content,
									[contentType]: {
										...response?.content?.[contentType],
										schema: mediaTypeObject.schema
									}
								}
							};
						}
					}
				);
			}

			this.openAPIDoc.paths[path][verb].responses = {
				...this.openAPIDoc.paths[path][verb].responses,
				[statusCode]: formattedResponse
			};
		});
	}

	async registerOpenapiRoutes() {
		const documentEnabled = this.moduleOptions.document?.enabled;
		const explorerEnabled = this.moduleOptions.explorer?.enabled;
		if (documentEnabled) {
			this.httpServerModule.get(this.moduleOptions.document?.path, (_req, res) =>
				this.httpServerModule.reply(res, this.openAPIDoc)
			);
		}

		if (explorerEnabled) {
			const swaggerUiHtml = generateSwaggerUiHtml({
				...(documentEnabled ? { path: this.moduleOptions.document.path } : { spec: this.openAPIDoc })
			});

			this.httpServerModule.get(this.moduleOptions.explorer?.path, (_req, res) => {
				this.httpServerModule.setHeader(res, 'content-type', 'text/html');
				this.httpServerModule.reply(res, swaggerUiHtml);
			});
		}
	}

	getOpenAPIDocument() {
		return this.openAPIDoc;
	}

	private createJsonSchema(jsonSchema: Partial<JSONSchema>) {
		if (typeof jsonSchema === 'object') {
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
								const refEntityDefinitionJson = this.createJsonSchema(
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
										items: { $ref: `#/components/schemas/${refEntityDefinitionJson.$id}` }
									};
								}

								return refEntityDefinitionJson;
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
						}

						if (refEntityDefinitionJson?.$id) {
							this.openAPIDoc.components.schemas[refEntityDefinitionJson.$id] = refEntityDefinitionJson;
							return { $ref: `#/components/schemas/${refEntityDefinitionJson.$id}` };
						}

						return refEntityDefinitionJson;
					}

					return p;
				})
			};
		}

		return jsonSchema;
	}

	// DRY function to generate single item or array definition objects
	private generateArrayOrSingleDefinition(jsonSchema: Partial<JSONSchema>, isArray): OpenAPIV3.SchemaObject {
		const singleJsonSchema = (
			jsonSchema.$id ? { $ref: `#/components/schemas/${jsonSchema.$id}` } : jsonSchema
		) as OpenAPIV3.SchemaObject;

		if (isArray) {
			return {
				type: 'array',
				items: singleJsonSchema
			};
		}

		return singleJsonSchema;
	}

	private getAndSetJsonSchema(item: ClassType) {
		const entityJsonSchema = this.entityRegistry.getJsonSchema(item);
		const jsonSchema = this.jsonSchemasMap.get(entityJsonSchema.title) ?? this.createJsonSchema(entityJsonSchema);

		if (!this.jsonSchemasMap.has(entityJsonSchema.title) && jsonSchema.$id) {
			this.jsonSchemasMap.set(jsonSchema.$id, jsonSchema);
			this.openAPIDoc.components.schemas[jsonSchema.$id] = jsonSchema;
		}

		return jsonSchema;
	}
}