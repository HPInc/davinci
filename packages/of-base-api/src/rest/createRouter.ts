import Ajv from 'ajv';
import Debug from 'debug';
import express from 'express';
import _ from 'lodash';
import Promise from 'bluebird';
import * as swaggerDocs from './swagger/openapiDocs';
import * as errors from '../errors';
import createPaths from './swagger/createPaths';
import createSchemaDefinition from './swagger/createSchemaDefinition';
const debug = Debug('of-base-api');

const AJV_OPTS = {
	allErrors: true,
	coerceTypes: true,
	useDefaults: true,
	removeAdditional: 'all'
};

function sendResults(res, statusCode) {
	return results => {
		if (results) {
			res.status(statusCode || 200).json(results);
		} else {
			res.status(statusCode || 204).end();
		}
	};
}

function sendError(next) {
	return err => {
		debug('error', err);
		if (typeof next === 'function') {
			next.call(null, err);
		}
	};
}

const attemptJsonParsing = ({ value, config, schema }) => {
	if (_.startsWith(value, '{') && _.endsWith(value, '}')) {
		try {
			return {
				value: JSON.parse(value),
				config,
				schema
			};
		} catch (err) {
			return {
				value,
				config,
				schema
			};
		}
	}

	return { value, config, schema };
};

const validateAndCoerce = ({ value, config, schema: resourceSchema }) => {
	const isUndefinedButNotRequired = !config.required && typeof value === 'undefined';
	if (config.schema && !isUndefinedButNotRequired) {
		// @ts-ignore
		const ajv = new Ajv(AJV_OPTS);
		const valid = ajv.addSchema({ ...config.schema, ...resourceSchema }, 'schema').validate('schema', value);
		if (!valid) {
			const error = new errors.BadRequest();
			error.errors = ajv.errors;
			throw error;
		}
	}

	return { value, config };
};

const processParameter = ({ value, config, schema = {} }) =>
	_.flow(
		attemptJsonParsing,
		validateAndCoerce,
		({ value: val }) => val
	)({
		value,
		config,
		schema
	});

const defaultContextFactory = ({ req, res }) => ({
	body: req.body,
	params: req.params,
	query: req.query,
	accountId: req.accountId,
	req,
	res
});

const mapReqToParameters = (req, res, parameters = [], contextFactory = defaultContextFactory) => {
	const context = contextFactory({ req, res });

	return parameters.reduce((acc, p) => {
		if (p.type === 'context') {
			acc.push(context);
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
				throw new errors.NotImplemented(`Can't get field ${p.name} - ${p.in} not yet supported`);
			}
			acc.push(processParameter({ value, config: p }));
		}
		return acc;
	}, []);
};

const makeHandlerFunction = (operation, controller, functionName, contextFactory) => {
	// @ts-ignore
	const successCode = _.findKey(operation.responses, (obj, key) => +key >= 200 && +key < 400);

	return (req, res, next) => {
		// need a custom middleware to set the context ID
		const parameterList = mapReqToParameters(req, res, operation.parameters, contextFactory);
		debug('calling ', functionName);
		// the controller functions return a promise
		// coerce the controller return value to be a promise
		return Promise.try(() => controller[functionName](...parameterList)).then(
			sendResults(res, successCode),
			sendError(next)
		);
	};
};

const makeMethodName = operation => {
	// this allows for namespaced operationId names
	// TODO is this required anymore?
	const operationParts = operation.operationId.split('.');
	const operationName = operationParts[operationParts.length - 1];
	return operationName.split('#')[0];
};

export const createRouteHandlers = (controller, definition, contextFactory) => {
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
			const handler = makeHandlerFunction(operation, controller, methodName, contextFactory);
			routeHandlers.push({ method, path, handler });
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

	// create the controller from the supplied class
	const controller = new Controller();

	// create the router
	const router = express.Router();

	// add the resource to the swagger documentation
	const definition = {
		definitions: createSchemaDefinition(controller.schema),
		paths: createPaths(Controller)
	};

	// now process the swagger structure and get an array of method/path mappings to handlers
	const routes = createRouteHandlers(controller, definition, contextFactory);

	// add them to the router
	routes.forEach(route => router[route.method](route.path, route.handler));

	swaggerDocs.addResource(resourceName, definition);

	return router;
};

// const createRoutersAndSwaggerDoc = ({}) => {};

export default createRouterAndSwaggerDoc;
