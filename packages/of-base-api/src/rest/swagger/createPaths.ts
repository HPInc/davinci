import _ from 'lodash';
import _fp from 'lodash/fp';
import { MethodParameter, PathsDefinition } from './types';
import { IControllerDecoratorArgs } from './decorators/rest';

const getParameterDefinition = methodParameterConfig => {
	const options: MethodParameter = methodParameterConfig.options;
	const definition = { ...options };
	// handling special parameters
	if (['context', 'req', 'res'].includes(methodParameterConfig.type)) {
		definition.schema = { type: methodParameterConfig.type };
	} else {
		const schema = _.get(methodParameterConfig, 'options.schema');
		definition.schema = {
			type: _.get(methodParameterConfig, 'type.name', '').toLowerCase(),
			...schema
		};
	}
	return definition;
};

const createPathsDefinition = (theClass: Function): PathsDefinition => {
	const controllerMetadata: IControllerDecoratorArgs = Reflect.getMetadata('tsswagger:controller', theClass) || {};
	// if (!controllerMetadata) throw new Error('Invalid Class. It must be decorated as controller');
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

	return _.reduce(
		methods,
		(acc, method) => {
			const { methodName, path, verb, summary, description, responses } = method;
			const parameters = _.filter(methodParameters, { methodName }).map(getParameterDefinition);

			_.set(acc, `${path}.${verb}`, {
				summary,
				description,
				operationId: methodName,
				parameters,
				responses
			});

			return acc;
		},
		{}
	);
};

export default createPathsDefinition;
