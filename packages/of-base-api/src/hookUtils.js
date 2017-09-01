const Promise = require('bluebird');
const _ = require('lodash');

function applyHook(service) {
	const serviceMethods = [
		'find',
		'get',
		'create',
		'update',
		'patch',
		'remove'
	];

	const hooks = {
		before: {
			all: [],
			find: [],
			get: [],
			create: [],
			update: [],
			patch: [],
			remove: []
		},
		after: {
			all: [],
			find: [],
			get: [],
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

	const createHookObject = ({ type, methodName: method, methodArgs, result }) => {
		const baseHook = {
			method,
			service,
			type,
			result
		};

		const context = methodArgs[methodArgs.length - 1];

		const methodHooks = {
			find: {
				params: _.assign({}, methodArgs[0], { context })
			},
			get: {
				id: methodArgs[0],
				params: _.assign({}, methodArgs[1], { context })
			},
			create: {
				data: methodArgs[0],
				params: _.assign({}, methodArgs[1], { context })
			},
			update: {
				id: methodArgs[0],
				data: methodArgs[1],
				params: _.assign({}, methodArgs[2], { context })
			},
			patch: {
				id: methodArgs[0],
				data: methodArgs[1],
				params: _.assign({}, methodArgs[2], { context })
			},
			remove: {
				id: methodArgs[0],
				params: _.assign({}, methodArgs[1], { context })
			}
		};

		return _.assign({}, baseHook, methodHooks[method]);
	};

	const execMethodHooks = (target, propName) => () => {
		return async function methodProxy(...args) {
			const method = target[propName];
			const beforeHooks = hooks.before[propName];
			const afterHooks = hooks.after[propName];

			await Promise.each(beforeHooks, hook => hook(createHookObject({
				type: 'before',
				methodName: propName,
				methodArgs: args
			})));

			const result = await method.call(target, ...args);

			await Promise.each(afterHooks, hook => hook(createHookObject({
				type: 'after',
				methodName: propName,
				methodArgs: args,
				result
			})));

			return result;
		};
	};

	const createServiceProxy = () => new Proxy(service, {
		get(target, propName) {
			if (serviceMethods.includes(propName)) {
				return execMethodHooks(target, propName)();
			} else if (propName === 'addHook') return addHook;

			return target[propName];
		}
	});

	return createServiceProxy();
}

module.exports = { applyHook };
