import 'reflect-metadata';
import _ from 'lodash';
import _fp from 'lodash/fp';
import { MethodParameter, PathsDefinition } from './types';
import { IControllerDecoratorArgs } from './decorators/rest';

const getParameterDefinition = methodParameterConfig => {
	const options: MethodParameter = methodParameterConfig.options;
	const type =
		methodParameterConfig.type === 'context'
			? methodParameterConfig.type
			: methodParameterConfig.type.name.toLowerCase();
	return { ...options, type };
};

const createPathsDefinition = (theClass: Function): PathsDefinition => {
	const controllerMetadata: IControllerDecoratorArgs = Reflect.getMetadata('tsswagger:controller', theClass);
	if (!controllerMetadata) throw new Error('');
	const { excludedMethods = [] } = controllerMetadata;
	const methods = (Reflect.getMetadata('tsswagger:methods', theClass.prototype) || []).filter(
		({ methodName }) => !excludedMethods.includes(methodName)
	);
	const contextMetadata: IControllerDecoratorArgs = Reflect.getMetadata('tscontroller:context', theClass.prototype);
	const methodParameters = _fp.flow(
		_fp.concat([contextMetadata]),
		_fp.sortBy('index'),
		_fp.compact
	)(Reflect.getMetadata('tsswagger:method-parameters', theClass.prototype) || []);
	// method parameters type Reflect.getMetadata('design:paramtypes', theClass.prototype, 'find');

	return _.reduce(
		methods,
		(acc, method) => {
			const { methodName, path, verb, summary, description } = method;
			const parameters = _.filter(methodParameters, { methodName }).map(getParameterDefinition);

			_.set(acc, `${path}.${verb}`, {
				summary,
				description,
				operationId: methodName,
				parameters
			});

			return acc;
		},
		{}
	);
};

export default createPathsDefinition;
