/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import _ from 'lodash';
import _fp from 'lodash/fp';
import { Reflector } from '@davinci/reflector';
import { PathsDefinition, PathsValidationOptions, ISwaggerDefinitions, IMethodDecoratorMetadata } from '../types';
import { IControllerDecoratorArgs } from '../decorators/route';
import { getOpenapiSchemaDefinitions } from './createOpenapiSchemaDefinitions';

const getParameterDefinition = methodParameterConfig => {
	const { type, options: { type: t = null, enum: enumOptions = null, ...options } = {} } = methodParameterConfig;
	const paramDefinition = { ...options, _index: methodParameterConfig.index };
	// handling special parameters
	if (['context', 'req', 'res'].includes(methodParameterConfig.type)) {
		paramDefinition.schema = { type: methodParameterConfig.type };
	} else {
		const schema = methodParameterConfig?.options?.schema;

		if (schema) {
			paramDefinition.schema = {
				...schema
			};
		} else if (enumOptions?.length) {
			const { schemas, definitions } = enumOptions.reduce(
				(acc, enumType) => {
					const { schema: s, definitions: d } = getOpenapiSchemaDefinitions(enumType);
					acc.schemas.push(s);
					acc.definitions = { ...acc.definitions, ...d };
					return acc;
				},
				{
					schemas: [],
					definitions: {}
				}
			);

			paramDefinition.schema = { oneOf: schemas };

			return { paramDefinition, definitions };
		} else {
			const { schema: s, definitions } = getOpenapiSchemaDefinitions(type);
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
			const { methodName, path, verb, summary, description, responses, validation, hidden } = method;
			const parameters = _.filter(methodParameters, { methodName })
				.map(getParameterDefinition)
				.map(({ paramDefinition, definitions = {} }) => {
					acc.definitions = { ...acc.definitions, ...definitions };
					return paramDefinition;
				});

			const resps = responses
				? _.mapValues(responses, response => {
					if (typeof response === 'function') {
						const { definitions: defs, schema } = getOpenapiSchemaDefinitions(response);
						acc.definitions = { ...acc.definitions, ...defs };
						return { schema };
					}

					return response;
				  })
				: { 200: { description: 'Success' } };

			const pathConfig: Record<string, unknown> = {
				summary,
				description,
				operationId: methodName,
				parameters,
				responses: resps
			};

			if (!_.isEmpty(hidden)) {
				pathConfig.hidden = pathConfig;
			}

			_.set(acc.paths, `${path}.${verb}`, pathConfig);

			_.set(acc.validationOptions, `${path}.${verb}`, validation || {});

			return acc;
		},
		{ paths: {}, definitions: {}, validationOptions: {} }
	);
};

export default createPathsDefinition;
