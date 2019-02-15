import 'reflect-metadata';
import _ from 'lodash';

type MethodParameter = {
	name: string;
	in: 'body' | 'path' | 'query';
	description?: string;
	required?: boolean;
	schema?: { $ref: string };
};

const getMethodParameterDefinition = methodParameterConfig => {
	const options: MethodParameter = methodParameterConfig.options;
	return options;
};

const createPathsDefinition = (theClass: Function): any => {
	const controller = Reflect.getMetadata('tsswagger:controller', theClass);
	if (!controller) throw new Error('');
	const methods = Reflect.getMetadata('tsswagger:methods', theClass.prototype) || [];
	const methodParameters = Reflect.getMetadata('tsswagger:method-parameters', theClass.prototype) || [];
	// method parameters type Reflect.getMetadata('design:paramtypes', theClass.prototype, 'find');

	return _.reduce(
		methods,
		(acc, method) => {
			const { methodName, path, verb, summary, description } = method;
			acc[path] = acc[path] || {};

			const parameters = _.filter(methodParameters, { methodName }).map(getMethodParameterDefinition);

			acc[path] = {
				[verb]: {
					summary,
					description,
					operationId: methodName,
					parameters
				}
			};

			return acc;
		},
		{}
	);
};

export default createPathsDefinition;
