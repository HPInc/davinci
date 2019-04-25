import _ from 'lodash';

/**
 * Factory function that generates a `req` or `res` decorator
 * @param reqOrRes
 */
export const createReqResExpressDecorator = (reqOrRes: 'req' | 'res') => () => (
	target: Object,
	methodName: string,
	index
) => {
	// get the existing metadata props
	const methodParameters = Reflect.getMetadata('tsswagger:method-parameters', target) || [];
	const isAlreadySet = !!_.find(methodParameters, { methodName, index });
	if (isAlreadySet) return;

	methodParameters.unshift({
		target,
		methodName,
		index,
		handler: target[methodName],
		type: reqOrRes
	});
	Reflect.defineMetadata('tsswagger:method-parameters', methodParameters, target);
};

/**
 * Decorator that inject the `req` express object as controller method parameter
 */
export const req = createReqResExpressDecorator('req');

/**
 * Decorator that inject the `res` express object as controller method parameter
 */
export const res = createReqResExpressDecorator('res');

/**
 * Decorator that allow to specify middlewares per controller or controller method basis
 * @param middlewareFunction
 * @param stage
 */
const middleware = (middlewareFunction, stage: 'before' | 'after' = 'before'): Function => {
	return function(target: Object | Function, methodName: string | symbol) {
		// get the existing metadata props
		const methods = Reflect.getMetadata('tsexpress:method-middleware', target) || [];
		const handler = target[methodName];
		methods.unshift({ middlewareFunction, handler, stage });
		// define new metadata methods
		Reflect.defineMetadata('tsexpress:method-middleware', methods, target);

		return target;
	};
};

/**
 * Decorator that allow to specify a `before` middlewares per controller method basis
 * @param middlewareFunction
 */
middleware.before = middlewareFunction => middleware(middlewareFunction, 'before');

/**
 * Decorator that allow to specify a `after` middlewares per controller method basis
 * @param middlewareFunction
 */
middleware.after = middlewareFunction => middleware(middlewareFunction, 'after');

export { middleware };

/**
 * Decorator that allow to set a response HTTP header
 * @param name
 * @param value
 */
export const header = (name: string, value: string) => {
	return function(target: Object, methodName: string | symbol) {
		// get the existing metadata props
		const methods = Reflect.getMetadata('tsexpress:method-response-header', target) || [];
		methods.unshift({ name, value, handler: target[methodName] });
		// define new metadata methods
		Reflect.defineMetadata('tsexpress:method-response-header', methods, target);
	};
};
