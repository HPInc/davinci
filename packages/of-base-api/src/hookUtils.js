const Promise = require('bluebird');

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

		const methodHooks = {
			find: {
				params: methodArgs[0]
			},
			get: {
				id: methodArgs[0],
				params: methodArgs[1]
			},
			create: {
				data: methodArgs[0],
				params: methodArgs[1]
			},
			update: {
				id: methodArgs[0],
				data: methodArgs[1],
				params: methodArgs[2]
			},
			patch: {
				id: methodArgs[0],
				data: methodArgs[1],
				params: methodArgs[2]
			},
			remove: {
				id: methodArgs[0],
				params: methodArgs[1]
			}
		};

		return Object.assign({}, baseHook, methodHooks[method]);
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
