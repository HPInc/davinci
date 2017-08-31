const express = require('express');
const _ = require('lodash');
const swaggerDocs = require('./openapiDocs');
const errors = require('feathers-errors');

function sendResults(res, statusCode) {
	return function (results) {
		if (results) {
			res.status(statusCode || 200).json(results);
		} else {
			res.status(statusCode || 204).end();
		}
	};
}

function sendError(next) {
	return function (err) {
		console.error('error', err);
		if (typeof next === 'function') {
			return next.call(null, err);
		}
	};
}

const mapReqToParameters = (req, parameters) => {
	if (!parameters) {
		return {
			body: req.body,
			params: req.params,
			query: req.query,
			contextId: req.contextId
		};
	}

	const context = {};
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
			context[p.name] = value;
		}
	});
	return context;
};

function createRouterAndSwaggerDoc(Controller, rsName) {
	const ctrlName = Controller.name;
	const resourceName = rsName || ctrlName.replace(/Controller$/, "").toLowerCase();
	const controller = new Controller();
	console.log('creating route');

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

			console.log('adding express route', method, convertedPath, `=> controller.${functionName}`);

			router[method](convertedPath, (req, res, next) => {

				// need a custom middleware to set the context ID
				const parameters = mapReqToParameters(req, operation.parameters);
				console.log('calling ', functionName);

				if (controller[functionName]) {
					// the controller functions return a promise
					controller[functionName](parameters)
						.then(sendResults(res), sendError(next));
				} else {
					console.log('Invalid Operation ID', functionName);
					return Promise.reject(new Error(`Invalid Controller Function: ${functionName}`));
				}
			});
		});

	});

	swaggerDocs.addResource(resourceName, controller.def);
	return router;
}


module.exports = createRouterAndSwaggerDoc;
