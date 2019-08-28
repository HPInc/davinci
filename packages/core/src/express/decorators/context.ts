// import 'reflect-metadata';
import { Reflector } from '@davinci/reflector';
import find from 'lodash/find';

/**
 * Decorate a parameter as context
 */
export const context = (): Function => {
	return function(target: Object, methodName: string | symbol, index) {
		const contextParameters = Reflector.getMetadata('tscontroller:context', target) || [];
		const isAlreadySet = !!find(contextParameters, { methodName, index });
		if (isAlreadySet) return;

		contextParameters.unshift({
			target,
			methodName,
			index,
			handler: target[methodName],
			type: 'context'
		});

		Reflector.defineMetadata('tscontroller:context', contextParameters, target);
	};
};
