import { Reflector } from '@davinci/reflector';
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
	const methodParameters = Reflector.getMetadata('tsopenapi:method-parameters', target) || [];
	const isAlreadySet = !!_.find(methodParameters, { methodName, index });
	if (isAlreadySet) return;

	methodParameters.unshift({
		target,
		methodName,
		index,
		handler: target[methodName],
		type: reqOrRes
	});
	Reflector.defineMetadata('tsopenapi:method-parameters', methodParameters, target);
};

/**
 * Decorator that inject the `req` express object as controller method parameter
 */
export const req = createReqResExpressDecorator('req');

/**
 * Decorator that inject the `res` express object as controller method parameter
 */
export const res = createReqResExpressDecorator('res');

type Stage = 'before' | 'after';

/**
 * Decorator that allow to specify middlewares per controller or controller method basis
 * @param middlewareFunction
 * @param stage
 */
const middleware = (middlewareFunction, stage: Stage = 'before'): Function => {
	return function(target: Object | Function, methodName: string | symbol) {
		const args: { middlewareFunction: Function; stage: Stage; handler?: Function } = { middlewareFunction, stage };
		if (target[methodName]) {
			args.handler = target[methodName];
		} // else, the target is a controller class

		// define new metadata methods
		Reflector.unshiftMetadata('tsexpress:method-middleware', args, target);

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
		const meta = { name, value, handler: target[methodName] };
		// define new metadata methods
		Reflector.unshiftMetadata('tsexpress:method-response-header', meta, target);
	};
};
