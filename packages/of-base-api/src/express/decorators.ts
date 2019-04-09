import _ from 'lodash';

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

export const req = createReqResExpressDecorator('req');
export const res = createReqResExpressDecorator('res');

export const middleware = middlewareFunction => {
	return function(target: Object, methodName: string | symbol) {
		// get the existing metadata props
		const methods = Reflect.getMetadata('tsexpress:method-middleware', target) || [];
		methods.unshift({ middlewareFunction, handler: target[methodName] });
		// define new metadata methods
		Reflect.defineMetadata('tsexpress:method-middleware', methods, target);
	};
};
