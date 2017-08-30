const express = require('express');
const _ = require('lodash');

// function redirect(url) {

// }

function sendResults(res, statusCode) {
	return function (results) {
		console.log('results', results);
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

module.exports = (def, controller) => {

	console.log('creating route');

	const router = express.Router();

	// for each path in the doc

	_.each(def.paths, (swaggerPath, pathName) => {

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

				const context = {
					body: req.body,
					params: req.params,
					query: req.query,
					contextId: req.contextId
				};

				console.log('calling ', functionName);

				if (controller[functionName]) {
					// the controller functions return a promise
					controller[functionName](context)
					// .then(redirect(res))
					.then(sendResults(res))
					.catch(sendError(next));
				} else {
					console.log('Invalid Operation ID', functionName);
					return Promise.reject(new Error(`Invalid Controller Function: ${functionName}`));
				}
			});
		});

	});

	return router;
};
