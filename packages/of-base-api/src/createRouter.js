const debug = require('debug')('of-base-api');
const express = require('express');
const _ = require('lodash');
const swaggerDocs = require('./openapiDocs');
const errors = require('feathers-errors');

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


/* TODO: implement a more robust type coercion system
	using one of: yup, joi or ajv
 */

const coerceType = (value, paramConfig) => {
	if (_.isNull(value) || _.isUndefined(value)) return value;
	const { type, format } = paramConfig;
	const key = _.compact([type, format]).join('_');

	const coerceSwitch = {
		string: String,
		integer: Number,
		string_JSON: val => {
			return _.isObject(val) ? val : JSON.parse(val);
		}
	};

	return (coerceSwitch[key] && coerceSwitch[key](value)) || value;
};

const mapReqToParameters = (req, res, parameters = []) => {
	const parameterList = {};
	_.each(parameters, p => {
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

			// TODO: better swagger validation (types, min/max, etc)
			if (_.isNil(value)) {
				if (p.required) throw new errors.BadRequest(`Missing required field ${p.name}`);
				if (p.schema && p.schema.default) value = p.schema.default;
			}


			parameterList[p.name] = coerceType(value, p);
		}
	});

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

function createRouterAndSwaggerDoc(Controller, rsName) {
	const ctrlName = Controller.name;
	const resourceName = rsName || ctrlName.replace(/Controller$/, '').toLowerCase();
	const controller = new Controller();
	debug('creating route');

	const router = express.Router();

	// for each path in the doc

	_.each(controller.def.paths, (swaggerPath, pathName) => {

		// convert it from swagger {param} format to express :param format
		let convertedPath = pathName;
		convertedPath = convertedPath.replace(/{(.*?)}/gi, ':$1');

		// for each method in the path add the operation to express
		_.each(swaggerPath, (operation, method) => {

			const operationParts = operation.operationId.split('.');
			const operationName = operationParts[operationParts.length - 1];
			const functionName = operationName.split('#')[0];

			debug('adding express route', method, convertedPath, `=> controller.${functionName}`);

			router[method](convertedPath, (req, res, next) => {

				// need a custom middleware to set the context ID
				const { parameterList, context } = mapReqToParameters(req, res, operation.parameters);
				debug('calling ', functionName);

				if (controller[functionName]) {
					// the controller functions return a promise
					controller[functionName](parameterList, context)
						.then(sendResults(res), sendError(next));
				} else {
					debug('Invalid Operation ID', functionName);
					throw new Error(`Invalid Controller Function: ${functionName}`);
				}
			});
		});

	});

	swaggerDocs.addResource(resourceName, controller.def);
	return router;
}


module.exports = createRouterAndSwaggerDoc;
