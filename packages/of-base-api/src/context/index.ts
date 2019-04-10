import find from 'lodash/find';

export const context = (options?): Function => {
	return function(target: Object, methodName: string | symbol, index) {
		// get the existing metadata props
		const contextParameters = Reflect.getMetadata('tscontroller:context', target) || [];
		const isAlreadySet = !!find(contextParameters, { methodName, index });
		if (isAlreadySet) return;

		contextParameters.unshift({
			target,
			methodName,
			index,
			options,
			handler: target[methodName],
			type: 'context'
		});

		Reflect.defineMetadata('tscontroller:context', contextParameters, target);
	};
};
