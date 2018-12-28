const Ajv = require('ajv');
const debug = require('debug')('of-base-api');
const express = require('express');
const _ = require('lodash');
const Promise = require('bluebird');
const swaggerDocs = require('./openapiDocs');
const errors = require('./errors');

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
		const ajv = new Ajv(AJV_OPTS);
		const valid = ajv
			.addSchema({ ...config.schema, ...resourceSchema }, 'schema')
			.validate('schema', value);
		if (!valid) {
			const error = new errors.BadRequest();
			error.errors = ajv.errors;
			throw error;
		}
	}

	return { value, config };
};

const processParameter = ({ value, config, schema }) =>
	_.flow(attemptJsonParsing, validateAndCoerce, ({ value: val }) => val)({
		value,
		config,
		schema
	});

const mapReqToParameters = (req, res, parameters = [], schema) => {
	const parameterList = parameters.reduce((acc, p) => {
		if (p.name) {
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
			acc[p.name] = processParameter({ value, config: p, schema });
		}
		return acc;
	}, {});

	const context = {
		body: req.body,
		params: req.params,
		query: req.query,
		accountId: req.accountId,
		req,
		res
	};

	return {
		parameterList,
		context
	};
};

const makeHandlerFunction = (operation, controller, functionName) => {
	const successCode = _.findKey(operation.responses, (obj, key) => (+key >= 200 && +key < 400));

	return (req, res, next) => {
		// need a custom middleware to set the context ID
		const { parameterList, context } = mapReqToParameters(req, res, operation.parameters, controller.def);
		debug('calling ', functionName);
		// the controller functions return a promise
		// coerce the controller return value to be a promise
		return Promise.try(() => controller[functionName](parameterList, context)).then(sendResults(res, successCode), sendError(next));
	};
};

const makeMethodName = operation => {
	// this allows for namespaced operationId names
	// TODO is this required anymore?
	const operationParts = operation.operationId.split('.');
	const operationName = operationParts[operationParts.length - 1];
	return operationName.split('#')[0];
};

const createRouteHandlers = controller => {
	const routeHandlers = [];

	// for each path
	_.each(controller.def.paths, (swaggerPath, pathName) => {

		// convert it from swagger {param} format to express :param format
		const path = pathName.replace(/{(.*?)}/gi, ':$1');

		// for each path/method
		_.each(swaggerPath, (operation, method) => {

			// get the method name for the controller
			const methodName = makeMethodName(operation);

			// only add it if the controller method exists, otherwise ignore it
			if (!controller[methodName]) return;

			// create the handler function
			const handler = makeHandlerFunction(operation, controller, methodName);
			routeHandlers.push({ method, path, handler });
		});
	});
	return routeHandlers;
};

const validateController = Controller => {
	if (!Controller) throw new Error('Invalid Controller - missing Controller');
	if (typeof Controller !== 'function') throw new Error('Invalid Controller - not function');
};

const createRouterAndSwaggerDoc = (Controller, rsName) => {

	// need to validate the inputs here
	validateController(Controller);

	// get a resource name either supplied or derive from Controller name
	const resourceName = rsName || Controller.name.replace(/Controller$/, '').toLowerCase();

	// create the controller from the supplied class
	const controller = new Controller();

	// create the router
	const router = express.Router();

	// now process the swagger structure and get an array of method/path mappings to handlers
	const routes = createRouteHandlers(controller);

	// add them to the router
	routes.forEach(route => router[route.method](route.path, route.handler));

	// add the resource to the swagger documentation
	swaggerDocs.addResource(resourceName, controller.def);

	return router;
};

module.exports = createRouterAndSwaggerDoc;
module.exports.createRouteHandlers = createRouteHandlers;
