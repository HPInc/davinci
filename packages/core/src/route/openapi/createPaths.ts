import _ from 'lodash';
import _fp from 'lodash/fp';
import { Reflector } from '@davinci/reflector';
import { IMethodParameter, PathsDefinition, ISwaggerDefinitions } from '../types/openapi';
import { IControllerDecoratorArgs } from '../decorators/route';
import { getSchemaDefinition } from './createSchemaDefinition';

const getParameterDefinition = methodParameterConfig => {
	const options: IMethodParameter = methodParameterConfig.options;
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
			const { schema, definitions } = getSchemaDefinition(methodParameterConfig.type);
			paramDefinition.schema = schema;

			return { paramDefinition, definitions };
		}
	}
	return { paramDefinition };
};

const createPathsDefinition = (theClass: Function): { paths: PathsDefinition; definitions: ISwaggerDefinitions } => {
	const controllerMetadata: IControllerDecoratorArgs = Reflector.getMetadata('tsopenapi:controller', theClass) || {};
	// if (!controllerMetadata) throw new Error('Invalid Class. It must be decorated as controller');
	const { excludedMethods = [] } = controllerMetadata;
	const methods = (Reflector.getMetadata('tsopenapi:methods', theClass.prototype) || []).filter(
		({ methodName }) => !excludedMethods.includes(methodName)
	);
	const contextMetadata: IControllerDecoratorArgs = Reflector.getMetadata('tscontroller:context', theClass.prototype);
	const methodParameters = _fp.flow(
		_fp.concat(contextMetadata),
		_fp.sortBy('index'),
		_fp.compact
	)(Reflector.getMetadata('tsopenapi:method-parameters', theClass.prototype) || []);

	return _.reduce(
		methods,
		(acc, method) => {
			const { methodName, path, verb, summary, description, responses } = method;
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

			return acc;
		},
		{ paths: {}, definitions: {} }
	);
};

export default createPathsDefinition;
