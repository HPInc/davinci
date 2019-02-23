export const context = (options?): Function => {
	return function(target: Object, methodName: string | symbol, index) {
		// get the existing metadata props
		const contextParameter = Reflect.getMetadata('tscontroller:context', target);
		if (contextParameter) return;

		const metadata = {
			target,
			methodName,
			index,
			options,
			handler: target[methodName],
			type: 'context'
		};

		Reflect.defineMetadata('tscontroller:context', metadata, target);
	};
};
