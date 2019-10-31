import Ajv from 'ajv';
import Debug from 'debug';
import express, { NextFunction, Response, Router } from 'express';
import _ from 'lodash';
import _fp from 'lodash/fp';
import Promise from 'bluebird';
import path from 'path';
import { ClassType, Reflector } from '@davinci/reflector';
import { DaVinciRequest } from '../express/types';

import * as errors from '../errors/httpErrors';
import * as openapiDocs from './openapi/openapiDocs';
import createPaths from './openapi/createPaths';
import createSchemaDefinition from './openapi/createSchemaDefinition';
import { IControllerDecoratorArgs } from './decorators/route';
import { IHeaderDecoratorMetadata } from '../express/types';

const { NotImplemented, BadRequest } = errors;

const debug = Debug('of-base-api');

const convertRefPaths = schema => {
	if (Array.isArray(schema)) {
		return schema.map(convertRefPaths);
	}

	if (typeof schema === 'object') {
		return _.reduce(
			schema,
			(acc, value, key) => {
				if (key === '$ref') {
					acc[key] = (value || '').replace(/#\/definitions\//, '');
				} else {
					acc[key] = convertRefPaths(value);
				}

				return acc;
			},
			{}
		);
	}

	return schema;
};

const performAjvValidation = ({ value, config: cfg, definitions }) => {
	const config = convertRefPaths(cfg);
	const ajv = new Ajv({
		allErrors: true,
		coerceTypes: true,
		useDefaults: true,
		removeAdditional: 'all'
	});
	const schema = {
		type: 'object',
		properties: { [config.name]: config.schema },
		required: config.required ? [config.name] : []
	};
	const data = { [config.name]: value };

	_.forEach(definitions, (schema, name) => {
		const parsedSchema = convertRefPaths(schema);
		ajv.addSchema(parsedSchema, name);
	});

	let errors;
	const valid = ajv.addSchema({ ...schema }, 'schema').validate('schema', data);
	if (!valid) {
		errors = ajv.errors;
	}

	return { value: data[config.name], errors };
};

const attemptJsonParsing = ({ value, config, definitions }) => {
	if (_.startsWith(value, '{') && _.endsWith(value, '}')) {
		try {
			return {
				value: JSON.parse(value),
				config,

				definitions
			};
		} catch (err) {
			return {
				value,
				config,

				definitions
			};
		}
	}

	return { value, config, definitions };
};

const validateAndCoerce = ({ value, config, definitions }) => {
	const isUndefinedButNotRequired = !config.required && typeof value === 'undefined';
	if (config.schema && !isUndefinedButNotRequired) {
		const { value: val, errors } = performAjvValidation({ value, config, definitions });
		if (errors) {
			throw new BadRequest('Validation error', { errors });
		}

		return { value: val, config };
	}

	return { value, config };
};

const processParameter = ({ value, config, definitions }) =>
	_fp.flow(
		attemptJsonParsing,
		validateAndCoerce,
		_fp.get('value')
	)({
		value,
		config,
		definitions
	});

type ContextFactory<ContextReturnType = any> = ({
	req,
	res
}: {
	req: DaVinciRequest;
	res: Response;
}) => ContextReturnType;

const defaultContextFactory: ContextFactory = ({ req, res }) => ({ req, res });

function mapReqToParameters<ContextType>(
	req: DaVinciRequest,
	res: Response,
	parameters = [],
	definitions,
	contextFactory: ContextFactory<ContextType> = defaultContextFactory
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
			acc.push(processParameter({ value, config: p, definitions }));
		}
		return acc;
	}, []);
}

const wrapMiddleware = middlewareFn => (req: DaVinciRequest, res: Response, next: NextFunction) => {
	if (req.requestHandled) return next();

	return middlewareFn(req, res, next);
};

const makeHandlerFunction = (
	operation,
	controller: InstanceType<ClassType>,
	functionName: string,
	definitions,
	contextFactory: ContextFactory
) => {
	const successCode = _.findKey(operation.responses, (_obj, key) => +key >= 200 && +key < 400);

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
		(req, res, next) => {
			if (req.requestHandled) return next();
			// need a custom middleware to set the context ID
			const parameterList = mapReqToParameters(
				req,
				res,
				operation.parameters,
				definitions,
				contextFactory
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
		}
	];
};

export const createRouteHandlers = (
	controller: InstanceType<ClassType>,
	definition,
	contextFactory?: ContextFactory
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
		const path = method.path.replace(/{(.*?)}/gi, ':$1');

		// create the handler function
		const handlers = makeHandlerFunction(
			operation,
			controller,
			method.methodName,
			definition.definitions,
			contextFactory
		);
		routeHandlers.push({ method: method.verb, path, handlers });
	});
	return routeHandlers;
};

const validateController = (Controller: ClassType) => {
	if (!Controller) throw new Error('Invalid Controller - missing Controller');
	if (typeof Controller !== 'function') throw new Error('Invalid Controller - not function');
};

const createRouterAndSwaggerDoc = (
	Controller: ClassType,
	rsName?: string,
	contextFactory?: ContextFactory
): Router => {
	// need to validate the inputs here
	validateController(Controller);

	// get a resource name either supplied or derive from Controller name
	const resourceName = rsName || Controller.name.replace(/Controller$/, '').toLowerCase();

	// get controller metadata
	const metadata: IControllerDecoratorArgs =
		Reflector.getMetadata('davinci:openapi:controller', Controller) || {};
	const basepath = metadata.basepath || '';
	const resourceSchema = metadata.resourceSchema;
	const additionalSchemas = metadata.additionalSchemas;

	// create the controller from the supplied class
	const controller = new Controller();

	// create the router
	const router = express.Router();

	// create the swagger structure
	const mainDefinition = resourceSchema ? createSchemaDefinition(resourceSchema) : {};
	const additionalDefinitions = _.reduce(
		additionalSchemas,
		(acc, schema) => ({ ...acc, ...createSchemaDefinition(schema) }),
		[]
	);

	const { paths, definitions: pathDefinitions } = createPaths(Controller);

	const definition = {
		definitions: {
			...mainDefinition,
			...additionalDefinitions,
			...pathDefinitions
		},
		paths
	};

	// now process the swagger structure and get an array of method/path mappings to handlers
	const routes = createRouteHandlers(controller, definition, contextFactory);

	// add them to the router
	routes.forEach(route => {
		const routePath = path.join(basepath, route.path);
		return router[route.method](routePath, ...route.handlers);
	});

	openapiDocs.addResource(resourceName, definition, basepath);

	return router;
};

export default createRouterAndSwaggerDoc;
