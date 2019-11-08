import _ from 'lodash';
import _fp from 'lodash/fp';
import { Reflector } from '@davinci/reflector';
import {
	IMethodParameter,
	PathsDefinition,
	PathsValidationOptions,
	ISwaggerDefinitions,
	IMethodDecoratorMetadata
} from '../types';
import { IControllerDecoratorArgs } from '../decorators/route';
import { getSchemaDefinition } from './createSchemaDefinition';

const getParameterDefinition = methodParameterConfig => {
	const {options} = methodParameterConfig;
	const paramDefinition = { ...options };
	// handling special parameters
	if (['context', 'req', 'res'].includes(methodParameterConfig.type)) {
		paramDefinition.schema = { type: methodParameterConfig.type };
	} else {
		const schema = _.get(methodParameterConfig, 'options.schema');
		if (schema) {
			paramDefinition.schema = {
				...schema
			};
		} else {
			const { schema: s, definitions } = getSchemaDefinition(methodParameterConfig.type);
			paramDefinition.schema = s;

			return { paramDefinition, definitions };
		}
	}
	return { paramDefinition };
};

const createPathsDefinition = (
	theClass: Function
): {
	paths: PathsDefinition;
	definitions: ISwaggerDefinitions;
	validationOptions: PathsValidationOptions;
} => {
	const controllerMetadata: IControllerDecoratorArgs =
		Reflector.getMetadata('davinci:openapi:controller', theClass) || {};
	const { excludedMethods = [] } = controllerMetadata;
	const methods: IMethodDecoratorMetadata[] = (
		Reflector.getMetadata('davinci:openapi:methods', theClass.prototype.constructor) || []
	).filter(({ methodName }) => !excludedMethods.includes(methodName));
	const contextMetadata: IControllerDecoratorArgs = Reflector.getMetadata(
		'davinci:context',
		theClass.prototype.constructor
	);
	const methodParameters = _fp.flow(
		_fp.concat(contextMetadata),
		_fp.sortBy('index'),
		_fp.compact
	)(Reflector.getMetadata('davinci:openapi:method-parameters', theClass.prototype.constructor) || []);

	return _.reduce(
		methods,
		(acc, method) => {
			const { methodName, path, verb, summary, description, responses, validation } = method;
			const parameters = _.filter(methodParameters, { methodName })
				.map(getParameterDefinition)
				.map(({ paramDefinition, definitions = {} }) => {
					acc.definitions = { ...acc.definitions, ...definitions };
					return paramDefinition;
				});

			const resps = responses
				? _.mapValues(responses, response => {
					if (typeof response === 'function') {
						const { definitions: defs, schema } = getSchemaDefinition(response);
						acc.definitions = { ...acc.definitions, ...defs };
						return { schema };
					}

					return response;
				  })
				: { 200: { description: 'Success' } };

			_.set(acc.paths, `${path}.${verb}`, {
				summary,
				description,
				operationId: methodName,
				parameters,
				responses: resps
			});

			_.set(acc.validationOptions, `${path}.${verb}`, validation || {});

			return acc;
		},
		{ paths: {}, definitions: {}, validationOptions: {} }
	);
};

export default createPathsDefinition;
