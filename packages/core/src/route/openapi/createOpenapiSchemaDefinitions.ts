/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import _fp from 'lodash/fp';
import _merge from 'lodash/merge';
import _omit from 'lodash/omit';
import { Reflector } from '@davinci/reflector';
import { ISwaggerDefinitions, IPropDecoratorMetadata } from '../types';

export const getOpenapiSchemaDefinitions = (theClass: Function, definitions = {}): ISwaggerDefinitions => {
	const makeSchema = (typeOrClass, key?) => {
		// it's a primitive type, simple case
		if ([String, Number, Boolean, Date].includes(typeOrClass)) {
			if (typeOrClass === Date) {
				return { type: 'string', format: 'date-time' };
			}

			return { type: typeOrClass.name.toLowerCase() };
		}

		// it's an array => recursively call makeSchema on the first array element
		if (Array.isArray(typeOrClass)) {
			return {
				type: 'array',
				items: makeSchema(typeOrClass[0], key)
			};
		}

		// it's an object (but not a definition) => recursively call makeSchema on the properties
		if (typeof typeOrClass === 'object') {
			const properties = _fp.map((value, k) => ({ [k]: makeSchema(value) }), typeOrClass);
			return {
				type: 'object',
				properties: _fp.isEmpty(properties) ? undefined : properties
			};
		}

		// it's a class => create a definition nad recursively call makeSchema on the properties
		if (typeof typeOrClass === 'function') {
			const definitionMetadata = Reflector.getMetadata(
				'davinci:openapi:definition',
				typeOrClass.prototype.constructor
			);
			const hasDefinitionDecoration = !!definitionMetadata;
			const definitionObj = {
				...(definitionMetadata || {}),
				type: 'object'
			};

			const title: string = definitionMetadata?.title ?? key ?? typeOrClass.name;
			if (hasDefinitionDecoration) {
				if (definitions[title]) {
					return {
						$ref: `#/definitions/${title}`
					};
				}

				definitions[title] = definitionObj;
			}

			if (title.toLowerCase() !== 'object') {
				definitionObj.title = title;
			}

			const props: IPropDecoratorMetadata<any>[] =
				Reflector.getMetadata('davinci:openapi:props', typeOrClass.prototype.constructor) || [];

			const properties = props.reduce((acc, { key: k, optsFactory }) => {
				const opts = optsFactory();

				let type =
					typeof opts?.type === 'undefined'
						? Reflector.getMetadata('design:type', typeOrClass.prototype, k)
						: opts.type;

				if (opts && typeof opts.typeFactory === 'function') {
					type = opts.typeFactory();
				}

				const schema = type ? makeSchema(type, k) : {};

				acc[k] = _merge(
					{},
					schema,
					_omit(opts, ['rawSchemaOptions', 'type', 'required', 'typeFactory']),
					opts?.rawSchemaOptions
				);

				return acc;
			}, {});

			if (!_fp.isEmpty(properties)) {
				definitionObj.properties = properties;
			}

			const required = _fp.flow(
				_fp.filter(({ optsFactory }: IPropDecoratorMetadata<any>) => {
					const options = optsFactory() || { required: false };
					return options.required;
				}),
				_fp.map('key')
			)(props);

			if (!_fp.isEmpty(required)) {
				definitionObj.required = required;
			}

			if (hasDefinitionDecoration) {
				definitions[title] = definitionObj;
				return {
					$ref: `#/definitions/${title}`
				};
			}

			return hasDefinitionDecoration ? { $ref: `#/definitions/${title}` } : definitionObj;
		}

		return null;
	};

	const schema = makeSchema(theClass);

	return { schema, definitions };
};

export const createOpenapiSchemaDefinitions = (theClass: Function) => {
	if (theClass) {
		const { definitions } = getOpenapiSchemaDefinitions(theClass);
		return definitions;
	}
	return {};
};

export default createOpenapiSchemaDefinitions;
