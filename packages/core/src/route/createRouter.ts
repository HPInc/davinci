/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import Debug from 'debug';
import express, { NextFunction, Response, Router } from 'express';
import _ from 'lodash';
import _fp from 'lodash/fp';
import Promise from 'bluebird';
import urlJoin from 'url-join';
import { ClassType, Reflector } from '@davinci/reflector';
import { DaVinciRequest, IHeaderDecoratorMetadata } from '../express/types';
import { NotImplemented, BadRequest } from '../errors/httpErrors';
import * as openapiDocs from './openapi/openapiDocs';
import createPaths from './openapi/createPaths';
import createOpenapiSchemaDefinitions from './openapi/createOpenapiSchemaDefinitions';
import { IControllerDecoratorArgs } from './decorators/route';
import { ISchema, ISwaggerDefinitions, MethodValidation, PathsValidationOptions } from './types';
import { DaVinciExpress } from '../index';
import responseHandler from '../express/middlewares/responseHandler';

const debug = new Debug('davinci:create-router');

const transformDefinitionToValidAJVSchemas = (
	schema,
	validationOptions: MethodValidation,
	type?: 'definition' | 'param'
) => {
	if (Array.isArray(schema)) {
		return schema.map(s => transformDefinitionToValidAJVSchemas(s, validationOptions));
	}

	if (typeof schema === 'object') {
		const result = _.reduce(
			schema,
			(acc, value, key) => {
				if (key === 'required' && validationOptions && validationOptions.partial) {
					return acc;
				}

				if (key === '$ref') {
					acc[key] = (value || '').replace(/#\/definitions\//, '');
				} else {
					acc[key] = transformDefinitionToValidAJVSchemas(value, validationOptions);
				}

				return acc;
			},
			{}
		);

		if (type === 'definition') {
			return _.omit(result, ['hidden']);
		}

		return result;
	}

	return schema;
};

type ProcessMethodParameters = {
	value: any;
	config: ISchema;
	definitions: ISwaggerDefinitions;
	validationOptions: MethodValidation;
	ajv: Ajv;
};

// TODO: This is a temporary workaround
export const ajvCache = {};

export const performAjvValidation = ({
	value,
	config: cfg,
	definitions,
	validationOptions,
	ajv
}: ProcessMethodParameters) => {
	const config = transformDefinitionToValidAJVSchemas(cfg, validationOptions);
	let required = [];
	if (!(validationOptions && validationOptions.partial) && config.required) {
		required = [config.name];
	}
	const schema = {
		type: 'object',
		properties: { [config.name]: config.schema },
		required
	};
	const serializedSchema = JSON.stringify(schema);
	let ajvInstance = ajvCache[serializedSchema];
	const data = { [config.name]: value };

	if (!ajvInstance) {
		ajvInstance = ajv;
		_.forEach(definitions, (theSchema, name) => {
			const parsedSchema = transformDefinitionToValidAJVSchemas(theSchema, validationOptions, 'definition');
			ajvInstance.addSchema(parsedSchema, name);
		});

		ajvInstance.addSchema({ ...schema }, 'schema');
		ajvCache[serializedSchema] = ajvInstance;
	}

	let errors;
	const valid = ajvInstance.validate('schema', data);
	if (!valid) {
		errors = ajvInstance.errors;
	}

	return { value: data[config.name], errors };
};

const attemptJsonParsing = ({ value, config, definitions, validationOptions, ajv }: ProcessMethodParameters) => {
	if (_.startsWith(value, '{') && _.endsWith(value, '}')) {
		try {
			return {
				value: JSON.parse(value),
				config,
				definitions,
				ajv
			};
		} catch (err) {
			return {
				value,
				config,
				definitions,
				ajv
			};
		}
	}

	return { value, config, definitions, validationOptions, ajv };
};

const validateAndCoerce = ({ value, config, definitions, validationOptions, ajv }: ProcessMethodParameters) => {
	const isUndefinedButNotRequired = !config.required && typeof value === 'undefined';
	if (config.schema && !isUndefinedButNotRequired) {
		const { value: val, errors } = performAjvValidation({ value, config, definitions, validationOptions, ajv });
		if (errors) {
			throw new BadRequest('Validation error', { errors });
		}

		return { value: val, config };
	}

	return { value, config };
};

const processParameter = ({ value, config, definitions, validationOptions, ajv }: ProcessMethodParameters) =>
	_fp.flow(
		attemptJsonParsing,
		validateAndCoerce,
		_fp.get('value')
	)({
		value,
		config,
		definitions,
		validationOptions,
		ajv
	});

type ContextFactory<ContextReturnType = any> = ({
	req,
	res
}: {
	req: DaVinciRequest;
	res: Response;
}) => ContextReturnType;

const defaultContextFactory: ContextFactory = ({ req, res }) => ({ req, res });

export type AjvFactoryParameters = { parameter };
export type AjvFactory = (parameters: AjvFactoryParameters) => Ajv;

const createDefaultAjvInstance: AjvFactory = () => {
	const ajv = new Ajv({
		allErrors: true,
		coerceTypes: true,
		useDefaults: true,
		removeAdditional: 'all'
	});
	addErrors(ajv);
	addFormats(ajv);
	return ajv;
};

function mapReqToParameters<ContextType>(
	req: DaVinciRequest,
	res: Response,
	parameters = [],
	definitions,
	methodValidationOptions: MethodValidation,
	contextFactory: ContextFactory<ContextType> = defaultContextFactory,
	ajv: AjvFactory = createDefaultAjvInstance
) {
	const context = contextFactory({ req, res });

	return parameters.reduce((acc, p) => {
		if (p.schema.type === 'context') {
			acc.push(context);
		} else if (p.schema.type === 'req') {
			acc.push(req);
		} else if (p.schema.type === 'res') {
			acc.push(res);
		} else if (p.name) {
			let value = null;
			if (p.in === 'query') {
				value = req.query[p.name];
			} else if (p.in === 'path') {
				value = req.params[p.name];
			} else if (p.in === 'header') {
				value = req.headers[p.name];
			} else if (p.in === 'body') {
				value = req.body;
			} else {
				throw new NotImplemented(`Can't get field ${p.name} - ${p.in} not yet supported`);
			}
			// eslint-disable-next-line no-underscore-dangle
			acc[p._index] = processParameter({
				value,
				config: p,
				definitions,
				validationOptions: methodValidationOptions,
				ajv: ajv({ parameter: p })
			});
		}
		return acc;
	}, []);
}

const wrapMiddleware = middlewareFn => {
	// it's an error middleware
	if (middlewareFn.length === 4) {
		return (err: Error, req: DaVinciRequest, res: Response, next: NextFunction) => {
			if (req.requestHandled) return next();

			return middlewareFn(err, req, res, next);
		};
	}
	return (req: DaVinciRequest, res: Response, next: NextFunction) => {
		if (req.requestHandled) return next();

		return middlewareFn(req, res, next);
	};
};

const makeHandlerFunction = (
	operation,
	controller: InstanceType<ClassType>,
	functionName: string,
	definitions,
	methodValidationOptions: MethodValidation,
	contextFactory: ContextFactory,
	ajv: AjvFactory
) => {
	// @ts-ignore-next-line
	const successCode = _.findKey(operation.responses, (obj, key) => +key >= 200 && +key < 400);

	// get middlewares
	const allMiddlewaresMeta = (
		Reflector.getMetadata('davinci:express:method-middleware', controller.constructor) || []
	).filter(metadata => metadata.handler === controller[functionName] || metadata.isControllerMw);

	const beforeMiddlewares = allMiddlewaresMeta.filter(m => m.stage === 'before');
	const afterMiddlewares = allMiddlewaresMeta.filter(m => m.stage === 'after');

	// get response headers
	const responseHeadersMeta: IHeaderDecoratorMetadata[] = Reflector.getMetadata(
		'davinci:express:method-response-header',
		controller.constructor.prototype
	);
	const methodResponseHeadersMeta = _.filter<IHeaderDecoratorMetadata>(responseHeadersMeta, {
		handler: controller[functionName]
	});

	return [
		..._.map(beforeMiddlewares, ({ middlewareFunction }) => wrapMiddleware(middlewareFunction)),
		function davinciHandler(req, res, next) {
			if (req.requestHandled) return next();
			const parameterList = mapReqToParameters(
				req,
				res,
				operation.parameters,
				definitions,
				methodValidationOptions,
				contextFactory,
				ajv
			);
			debug('calling ', functionName);
			// the controller functions return a promise
			// coerce the controller return value to be a promise
			return Promise.try(() => controller[functionName](...parameterList)).then(
				result => {
					req.result = result;
					req.statusCode = successCode;

					methodResponseHeadersMeta.forEach(({ name, value }) => {
						res.header(name, value);
					});

					next();
				},
				err => next(err)
			);
		},
		..._.map(afterMiddlewares, ({ middlewareFunction }) => wrapMiddleware(middlewareFunction)),
		// tslint:disable-next-line:variable-name
		(req, _res, next) => {
			req.requestHandled = true;
			next();
		},
		responseHandler
	];
};

export const createRouteHandlers = (
	controller: InstanceType<ClassType>,
	definition,
	validationOptions: PathsValidationOptions,
	contextFactory?: ContextFactory,
	ajv?: AjvFactory
) => {
	const routeHandlers = [];
	const methods = Reflector.getMetadata('davinci:openapi:methods', controller.constructor) || [];

	// for each path
	_.each(methods, method => {
		const operation =
			definition.paths[method.path] && definition.paths[method.path][method.verb]
				? definition.paths[method.path][method.verb]
				: null;

		// only add it if the controller method exists, otherwise ignore it
		if (!controller[method.methodName] || !operation) return;

		// convert it from swagger {param} format to express :param format
		const thePath = method.path.replace(/{(.*?)}/gi, ':$1');

		// create the handler function
		const handlers = makeHandlerFunction(
			operation,
			controller,
			method.methodName,
			definition.definitions,
			_.get(validationOptions, `[${method.path}][${method.verb}]`, {}) as MethodValidation,
			contextFactory,
			ajv
		);
		routeHandlers.push({ method: method.verb, path: thePath, handlers });
	});
	return routeHandlers;
};

const validateController = (Controller: ClassType) => {
	if (typeof Controller !== 'function') throw new Error('Invalid Controller - not function');
};

export type CreateRouterParameters = {
	Controller: ClassType;
	resourceName?: string | null;
	contextFactory?: ContextFactory | null;
	router?: Router;
	ajvFactory?: AjvFactory | null;
};

type CreateRouterParametersArray = [
	ClassType,
	string | null | undefined,
	ContextFactory | null | undefined,
	Router | undefined
];

function processParameters(params: [CreateRouterParameters] | CreateRouterParametersArray): CreateRouterParameters {
	// need to validate the inputs here
	if (!params?.[0]) throw new Error('Invalid Controller - missing Controller');

	// object parameter, returning it
	if ('Controller' in params?.[0]) return params?.[0];

	return {
		Controller: params[0],
		resourceName: params[1],
		contextFactory: params[2],
		router: params[3]
	};
}

function createRouterAndSwaggerDoc(parameters: CreateRouterParameters): Router | DaVinciExpress;
/**
 * The base class for controls that can be rendered.
 *
 * @deprecated pass arguments using a parameter object: createRouter({ Controller: MyController })
 */
function createRouterAndSwaggerDoc(
	Controller: ClassType,
	resourceName?: string | null,
	contextFactory?: ContextFactory | null,
	router?: Router
): Router | DaVinciExpress;

function createRouterAndSwaggerDoc(...options): Router | DaVinciExpress {
	const {
		Controller,
		resourceName: rsName,
		contextFactory,
		router = express.Router(),
		ajvFactory
	} = processParameters(options as [CreateRouterParameters] | CreateRouterParametersArray);

	validateController(Controller);

	// get a resource name either supplied or derive from Controller name
	const resourceName = rsName || Controller.name.replace(/Controller$/, '').toLowerCase();

	// get controller metadata
	const metadata: IControllerDecoratorArgs = Reflector.getMetadata('davinci:openapi:controller', Controller) || {};
	const basepath = metadata.basepath || '/';
	const { resourceSchema } = metadata;
	const { additionalSchemas } = metadata;

	// create the controller from the supplied class
	const controller = new Controller();

	// create the swagger structure
	const mainDefinition = resourceSchema ? createOpenapiSchemaDefinitions(resourceSchema) : {};
	const additionalDefinitions = _.reduce(
		additionalSchemas,
		(acc, schema) => ({ ...acc, ...createOpenapiSchemaDefinitions(schema) }),
		[]
	);

	const { paths, definitions: pathDefinitions, validationOptions } = createPaths(Controller);

	const definition = {
		definitions: {
			...mainDefinition,
			...additionalDefinitions,
			...pathDefinitions
		},
		paths
	};

	// now process the swagger structure and get an array of method/path mappings to handlers
	const routes = createRouteHandlers(controller, definition, validationOptions, contextFactory, ajvFactory);

	// add them to the router
	routes.forEach(route => {
		const routePath = urlJoin(basepath, route.path);
		return router[route.method](routePath, ...route.handlers);
	});

	openapiDocs.addResource(definition, resourceName, basepath);

	return router;
}

export default createRouterAndSwaggerDoc;
