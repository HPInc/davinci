import Ajv from 'ajv';
import Debug from 'debug';
import express, { Request, Response } from 'express';
import _ from 'lodash';
import _fp from 'lodash/fp';
import Promise from 'bluebird';
import path from 'path';
import * as swaggerDocs from './swagger/openapiDocs';
import { NotImplemented, BadRequest } from '../errors';
import createPaths from './swagger/createPaths';
import createSchemaDefinition from './swagger/createSchemaDefinition';
// import { route } from '../route';

const debug = Debug('of-base-api');

const AJV_OPTS = {
	allErrors: true,
	coerceTypes: true,
	useDefaults: true,
	removeAdditional: 'all'
};

export interface RequestCustom extends Request {
	context?: any;
	accountId?: any;
}

type ContextFactoryArgs = {
	req?: RequestCustom;
	res?: Response;
};

const performAjvValidation = ({ value, config, definitions }) => {
	// @ts-ignore
	const ajv = new Ajv(AJV_OPTS);
	const schema = {
		type: 'object',
		properties: { [config.name]: config.schema },
		required: config.required ? [config.name] : []
	};
	const data = { [config.name]: value };

	_.forEach(definitions, (schema, name) => ajv.addSchema(schema, name));

	let errors;
	const valid = ajv.addSchema({ ...schema }, 'schema').validate('schema', data);
	if (!valid) {
		errors = ajv.errors;
	}

	return { value: data[config.name], errors };
};

const validateAndCoerce = ({ value, config, definitions }) => {
	const isUndefinedButNotRequired = !config.required && typeof value === 'undefined';
	if (config.schema && !isUndefinedButNotRequired) {
		// @ts-ignore
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
		validateAndCoerce,
		_fp.get('value')
	)({
		value,
		config,
		definitions
	});

const defaultContextFactory = ({ req }: ContextFactoryArgs) => ({
	body: req.body,
	params: req.params,
	query: req.query,
	accountId: req.accountId
});

const mapReqToParameters = (req, res, parameters = [], definitions, contextFactory = defaultContextFactory) => {
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
};

const wrapMiddleware = middlewareFn => (req, res, next) => {
	if (req.requestHandled) return next();

	return middlewareFn(req, res, next);
};

const makeHandlerFunction = (operation, controller, functionName, definitions, contextFactory) => {
	// @ts-ignore
	const successCode = _.findKey(operation.responses, (obj, key) => +key >= 200 && +key < 400);

	// get middlewares
	const methodMiddlewaresMeta = _.filter(
		Reflect.getMetadata('tsexpress:method-middleware', controller.constructor.prototype),
		{ handler: controller[functionName] }
	);
	const controllerMiddlewaresMeta = Reflect.getMetadata('tsexpress:method-middleware', controller.constructor) || [];
	const allMiddlewaresMeta = [...controllerMiddlewaresMeta, ...methodMiddlewaresMeta];
	const beforeMiddlewares = allMiddlewaresMeta.filter(m => m.stage === 'before');
	const afterMiddlewares = allMiddlewaresMeta.filter(m => m.stage === 'after');

	// get response headers
	const responseHeadersMeta = Reflect.getMetadata(
		'tsexpress:method-response-header',
		controller.constructor.prototype
	);
	const methodResponseHeadersMeta = _.filter(responseHeadersMeta, { handler: controller[functionName] });

	return [
		..._.map(beforeMiddlewares, ({ middlewareFunction }) => wrapMiddleware(middlewareFunction)),
		(req, res, next) => {
			if (req.requestHandled) return next();
			// need a custom middleware to set the context ID
			const parameterList = mapReqToParameters(req, res, operation.parameters, definitions, contextFactory);
			debug('calling ', functionName);
			// the controller functions return a promise
			// coerce the controller return value to be a promise
			return Promise.try(() => controller[functionName](...parameterList)).then(
				result => {
					req.result = result;
					req.statusCode = successCode;

					// @ts-ignore
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

const makeMethodName = operation => {
	// this allows for namespaced operationId names
	// TODO is this required anymore?
	const operationParts = operation.operationId.split('.');
	const operationName = operationParts[operationParts.length - 1];
	return operationName.split('#')[0];
};

export const createRouteHandlers = (controller, definition, contextFactory?) => {
	const routeHandlers = [];

	// for each path
	_.each(definition.paths, (swaggerPath, pathName) => {
		// convert it from swagger {param} format to express :param format
		const path = pathName.replace(/{(.*?)}/gi, ':$1');

		// for each path/method
		_.each(swaggerPath, (operation, method) => {
			// get the method name for the controller
			const methodName = makeMethodName(operation);

			// only add it if the controller method exists, otherwise ignore it
			if (!controller[methodName]) return;

			// create the handler function
			const handlers = makeHandlerFunction(
				operation,
				controller,
				methodName,
				definition.definitions,
				contextFactory
			);
			routeHandlers.push({ method, path, handlers });
		});
	});
	return routeHandlers;
};

const validateController = Controller => {
	if (!Controller) throw new Error('Invalid Controller - missing Controller');
	if (typeof Controller !== 'function') throw new Error('Invalid Controller - not function');
};

const createRouterAndSwaggerDoc = (Controller, rsName?, contextFactory?) => {
	// need to validate the inputs here
	validateController(Controller);

	// get a resource name either supplied or derive from Controller name
	const resourceName = rsName || Controller.name.replace(/Controller$/, '').toLowerCase();

	// get controller metadata
	const metadata = Reflect.getMetadata('tsswagger:controller', Controller) || {};
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

	const definition = {
		definitions: {
			...mainDefinition,
			...additionalDefinitions
		},
		paths: createPaths(Controller)
	};

	// now process the swagger structure and get an array of method/path mappings to handlers
	const routes = createRouteHandlers(controller, definition, contextFactory);

	// add them to the router
	routes.forEach(route => {
		const routePath = path.join(basepath, route.path);
		return router[route.method](routePath, ...route.handlers);
	});

	swaggerDocs.addResource(resourceName, definition);

	return router;
};

export default createRouterAndSwaggerDoc;
