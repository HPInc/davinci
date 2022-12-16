/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import {
	App,
	EntityDefinition,
	EntityDefinitionJSONSchema,
	EntityRegistry,
	JSONSchema,
	mapObject,
	mapSeries,
	Module,
	omit
} from '@davinci/core';
import type { HttpServerModule, MethodResponses, Route } from '@davinci/http-server';
import http, { Server } from 'http';
import pino, { Level } from 'pino';
import { OpenAPIV3 } from 'openapi-types';
import createDeepMerge from '@fastify/deepmerge';
import { ClassType, PartialDeep, TypeValue } from '@davinci/reflector';
import { generateSwaggerUiHtml } from './swaggerUi';

const deepMerge = createDeepMerge();

export interface OpenAPIModuleOptions {
	document: {
		enabled?: boolean;
		path?: string;
		spec: Partial<OpenAPIV3.Document>;
		automaticOperationIds?: boolean;
		operationIdFormatter?: (route: Route<any> & { controllerName: string; methodName: string }) => string;
		automaticPathTags?: boolean;
	};
	explorer?: {
		enabled?: boolean;
		path?: string;
	};
	defaults?: {
		responseContentType?: string;
		responses?: MethodResponses | ((route: Route<unknown>) => MethodResponses);
	};
	logger?: {
		name?: string;
		level?: Level | 'silent';
	};
}

export class OpenAPIModule extends Module {
	app: App;
	moduleOptions: OpenAPIModuleOptions;
	logger = pino({ name: 'openAPI-module' });
	httpServerModule: HttpServerModule<{ Server: Server }>;
	httpServer: Server;
	entityRegistry: EntityRegistry;
	openAPIDoc: PartialDeep<OpenAPIV3.Document>;
	private jsonSchemasMap = new Map<string, JSONSchema | Partial<JSONSchema>>();

	constructor(moduleOptions: OpenAPIModuleOptions) {
		super();
		this.moduleOptions = deepMerge(
			{
				document: {
					enabled: true,
					path: '/api-doc.json',
					automaticOperationIds: true,
					operationIdFormatter({ controllerName, methodName }) {
						const resourceName = controllerName.replace(/Controller/, '');
						const controllerN = resourceName.charAt(0).toLowerCase() + resourceName.slice(1);
						const methodN = methodName.charAt(0).toUpperCase() + methodName.slice(1);
						return `${controllerN}${methodN}`;
					},
					automaticPathTags: true,
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

		if (this.moduleOptions.logger?.level) {
			this.logger.level = this.moduleOptions.logger?.level;
		}
	}

	getModuleId() {
		return 'openapi';
	}

	async onRegister(app: App) {
		this.app = app;

		const level = this.moduleOptions.logger?.level ?? app.getOptions().logger?.level;
		if (level) {
			this.logger.level = level;
		}

		this.httpServerModule = await app.getModuleById<HttpServerModule<{ Server: Server }>>('http', 'registered');
		this.httpServer = this.httpServerModule?.getHttpServer() ?? http.createServer();
		this.entityRegistry = this.httpServerModule.getEntityRegistry();
		const routes = this.httpServerModule.getRoutes();

		await mapSeries(routes, route => this.createPathAndSchema(route));

		await this.registerOpenapiRoutes();
	}

	async createPathAndSchema(route: Route<unknown>): Promise<void> {
		const {
			path: origPath,
			verb,
			parametersConfig,
			methodReflection,
			methodDecoratorMetadata,
			controllerDecoratorMetadata,
			controllerReflection
		} = route;
		if (methodDecoratorMetadata.options?.hidden) return;

		// transform path parameters, e.g. :id to {id}
		const path = origPath.replace(/:([\w-]+)/g, '{$1}');

		this.openAPIDoc.paths[path] = this.openAPIDoc.paths[path] ?? {};

		const resourceName = controllerReflection.name.replace(/Controller/, '');
		// tags handling
		let tags: Array<string>;
		if (controllerDecoratorMetadata?.options?.tags) {
			tags = controllerDecoratorMetadata?.options?.tags;
		} else if (this.moduleOptions.document?.automaticPathTags) {
			tags = [resourceName];
		}

		// operationId handling
		let operationId: string;
		if (methodDecoratorMetadata.options?.operationId) {
			operationId = methodDecoratorMetadata.options?.operationId;
		} else if (this.moduleOptions?.document?.automaticOperationIds) {
			operationId = this.moduleOptions?.document?.operationIdFormatter?.({
				...route,
				controllerName: controllerReflection.name,
				methodName: methodReflection.name
			});
		}

		this.openAPIDoc.paths[path][verb] = {
			...(methodDecoratorMetadata.options?.summary && { summary: methodDecoratorMetadata.options?.summary }),
			...(methodDecoratorMetadata.options?.description && {
				description: methodDecoratorMetadata.options?.description
			}),
			...this.openAPIDoc.paths[path][verb],
			...(tags ? { tags } : {}),
			...(operationId ? { operationId } : {})
		};

		// Parameters handling
		await mapSeries(parametersConfig, parameterConfig => {
			if (
				parameterConfig.source === 'context' ||
				parameterConfig.source === 'request' ||
				parameterConfig.source === 'response'
			)
				return;

			const entityJsonSchema = this.entityRegistry.getEntityDefinitionJsonSchema(parameterConfig.type);

			const jsonSchema =
				this.jsonSchemasMap.get(entityJsonSchema.title) ?? this.createJsonSchema(entityJsonSchema);
			if (!this.jsonSchemasMap.has(entityJsonSchema.title) && jsonSchema.$id) {
				this.jsonSchemasMap.set(jsonSchema.$id, jsonSchema);
				this.openAPIDoc.components.schemas[jsonSchema.$id] = jsonSchema;
			}

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
		const defaultResponses =
			typeof this.moduleOptions?.defaults?.responses === 'function'
				? this.moduleOptions?.defaults?.responses(route)
				: this.moduleOptions?.defaults?.responses;

		const responses = { ...defaultResponses, ...methodDecoratorMetadata.options?.responses };
		const defaultResponseContentType = this.moduleOptions?.defaults?.responseContentType ?? 'application/json';

		mapObject(responses, (response, statusCode) => {
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
						[defaultResponseContentType]: {
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
						[defaultResponseContentType]: {
							schema: this.generateArrayOrSingleDefinition(jsonSchema, Array.isArray(response.content))
						}
					}
				};
			} else if (typeof response.content === 'object') {
				mapObject(
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
			const path = this.moduleOptions.document?.path;
			this.httpServerModule.get(path, (_req, res) => {
				this.httpServerModule.setHeader(res, 'content-type', 'application/json');
				this.httpServerModule.reply(res, this.openAPIDoc);
			});
		}

		if (explorerEnabled) {
			const swaggerUiHtml = generateSwaggerUiHtml({
				...(documentEnabled ? { path: this.moduleOptions.document.path } : { spec: this.openAPIDoc })
			});

			const path = this.moduleOptions.explorer?.path;
			this.httpServerModule.get(path, (_req, res) => {
				this.httpServerModule.setHeader(res, 'content-type', 'text/html');
				this.httpServerModule.reply(res, swaggerUiHtml);
			});
		}
	}

	getOpenAPIDocument(): PartialDeep<OpenAPIV3.Document> {
		return this.openAPIDoc;
	}

	private createJsonSchema(entityJsonSchema: EntityDefinitionJSONSchema): Partial<JSONSchema> {
		return this.entityRegistry.transformEntityDefinitionSchema(entityJsonSchema, args => {
			if (args.pointerPath === '') {
				return { path: '', value: omit(args.schema, ['properties']) };
			}

			if (args.schema._$ref) {
				const ref: EntityDefinition = args.schema._$ref;
				const childEntityDefJsonSchema = this.createJsonSchema(ref.getEntityDefinitionJsonSchema());
				if (childEntityDefJsonSchema.$id) {
					if (!this.jsonSchemasMap.has(childEntityDefJsonSchema.$id)) {
						this.jsonSchemasMap.set(childEntityDefJsonSchema.$id, childEntityDefJsonSchema);
					}
					this.openAPIDoc.components.schemas[childEntityDefJsonSchema.$id] = childEntityDefJsonSchema;

					return {
						path: args.pointerPath,
						value: { $ref: `#/components/schemas/${childEntityDefJsonSchema.$id}` }
					};
				}
				return { path: args.pointerPath, value: childEntityDefJsonSchema };
			}

			if (typeof args.schema === 'function') {
				const childEntityDefJsonSchema = this.createJsonSchema(
					this.entityRegistry.getEntityDefinitionJsonSchema(args.schema)
				);
				if (childEntityDefJsonSchema.$id) {
					if (!this.jsonSchemasMap.has(childEntityDefJsonSchema.$id)) {
						this.jsonSchemasMap.set(childEntityDefJsonSchema.$id, childEntityDefJsonSchema);
					}
					this.openAPIDoc.components.schemas[childEntityDefJsonSchema.$id] = childEntityDefJsonSchema;

					return {
						path: args.pointerPath,
						value: { $ref: `#/components/schemas/${childEntityDefJsonSchema.$id}` }
					};
				}
				return { path: args.pointerPath, value: childEntityDefJsonSchema };
			}
			if (args.parentKeyword === 'properties') {
				return { path: args.pointerPath, value: args.schema };
			}

			return null;
		});
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

	private getAndSetJsonSchema(item: TypeValue) {
		const entityJsonSchema = this.entityRegistry.getEntityDefinitionJsonSchema(item);
		const jsonSchema = this.jsonSchemasMap.get(entityJsonSchema.title) ?? this.createJsonSchema(entityJsonSchema);

		if (!this.jsonSchemasMap.has(entityJsonSchema.title) && jsonSchema.$id) {
			this.jsonSchemasMap.set(jsonSchema.$id, jsonSchema);
			this.openAPIDoc.components.schemas[jsonSchema.$id] = jsonSchema;
		}

		return jsonSchema;
	}
}
