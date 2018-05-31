const Promise = require('bluebird');
const _ = require('lodash');
const baseService = require('./baseService');

function applyHook(service) {
	const serviceMethods = [
		'find',
		'findOne',
		'create',
		'update',
		'patch',
		'remove'
	];

	const hooks = {
		before: {
			all: [],
			find: [],
			findOne: [],
			create: [],
			update: [],
			patch: [],
			remove: []
		},
		after: {
			all: [],
			find: [],
			findOne: [],
			create: [],
			update: [],
			patch: [],
			remove: []
		}
	};

	const addHook = (stage, method, fn) => {
		const methodHooks = hooks[stage][method];
		const fns = Array.isArray(fn) ? fn : [fn];
		methodHooks.push(...fns);
	};

	const hooksMethods = {
		addHook,
		before: (method, fn) => addHook('before', method, fn),
		after: (method, fn) => addHook('after', method, fn)
	};

	const createHookObject = ({ type, methodName: method, methodArgs, result }) => {
		const baseHook = {
			method,
			service,
			type,
			result
		};

		const context = methodArgs[methodArgs.length - 1];

		const buildParams = arg => _.assign({}, arg, { context });

		const methodHooks = {
			find: {
				params: buildParams(methodArgs[0])
			},
			findOne: {
				params: buildParams(methodArgs[0])
			},
			create: {
				data: methodArgs[0],
				params: buildParams(methodArgs[1])
			},
			update: {
				id: methodArgs[0],
				data: methodArgs[1],
				params: buildParams(methodArgs[2])
			},
			patch: {
				id: methodArgs[0],
				data: methodArgs[1],
				params: buildParams(methodArgs[2])
			},
			remove: {
				id: methodArgs[0],
				params: buildParams(methodArgs[1])
			}
		};

		return _.assign({}, baseHook, methodHooks[method]);
	};

	const getArgsFromHookObject = (methodName, hook) => {
		const methodArgsFormat = {
			find: [hook.params],
			findOne: [hook.params],
			create: [hook.data, hook.params],
			patch: [hook.id, hook.data, hook.params],
			remove: [hook.id, hook.params]
		};
		return methodArgsFormat[methodName];
	};

	const execMethodHooks = (target, propName) => () => {
		return async function methodProxy(...args) {
			const method = target[propName];
			const beforeHooks = hooks.before[propName];
			const afterHooks = hooks.after[propName];

			const hookObj = createHookObject({
				type: 'before',
				methodName: propName,
				methodArgs: args
			});

			if (!hookObj.params.skipHooks) {
				await Promise.each(beforeHooks, hook => hook(hookObj));
			}

			const newArgs = getArgsFromHookObject(propName, hookObj);
			if (!hookObj.result) {
				hookObj.result = await method.call(target, ...newArgs);
			}

			const afterHookObj = _.assign({}, hookObj, { type: 'after' });
			if (!hookObj.params.skipHooks) {
				await Promise.each(afterHooks, hook => hook(afterHookObj));
			}

			return afterHookObj.result;
		};
	};

	const decorateWithBaseServiceMethods = srvc => {
		// create an object that takes the baseService (findOne) methods
		return Object.assign(srvc, baseService);
	};

	const createServiceProxy = () => {

		const baseServiceMethods = {
			// overwriting the .get method
			get(target, propName) {
				// is it a fundamental service method
				if (serviceMethods.includes(propName)) {
					// execute the hooks
					return execMethodHooks(target, propName)();
				} else if (hooksMethods[propName]) {
					// otherwise return the hook function (before, after etc)
					return hooksMethods[propName];
				}
				// otherwise just return the property value on the target
				return target[propName];
			}
		};

		// this adds the baseService.findOne method
		const decoratedService = decorateWithBaseServiceMethods(service);

		// new Proxy(target, handlerObject)
		return new Proxy(decoratedService, baseServiceMethods);
	};

	return createServiceProxy();
}

module.exports = { applyHook };
