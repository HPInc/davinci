import _fp from 'lodash/fp';
import { Reflector } from '@davinci/reflector';
import { ISwaggerDefinitions } from '../types/openapi';
import { IPropDecoratorMetadata } from '../decorators/types';

export const getSchemaDefinition = (theClass: Function, definitions = {}): ISwaggerDefinitions => {
	const makeSchema = (typeOrClass, key?) => {
		// it's a primitive type, simple case
		if ([String, Number, Boolean, Date].includes(typeOrClass)) {
			if (typeOrClass === Date) {
				return { type: 'string', format: 'date' };
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
			const properties = _fp.map((value, key) => ({ [key]: makeSchema(value) }), typeOrClass);
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

			const title: string = hasDefinitionDecoration
				? definitionMetadata.title
				: key || typeOrClass.name;
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

			const props: IPropDecoratorMetadata[] =
				Reflector.getMetadata('davinci:openapi:props', typeOrClass.prototype.constructor) || [];

			const properties = props.reduce((acc, { key, optsFactory }) => {
				const opts = optsFactory();
				let type =
					opts && opts.type
						? opts.type
						: Reflector.getMetadata('design:type', typeOrClass.prototype, key);

				if (opts && typeof opts.typeFactory === 'function') {
					type = opts.typeFactory();
				}

				acc[key] = makeSchema(type, key);
				return acc;
			}, {});

			if (!_fp.isEmpty(properties)) {
				definitionObj.properties = properties;
			}

			const required = _fp.flow(
				_fp.filter(({ optsFactory }: IPropDecoratorMetadata) => {
					const options = optsFactory() || {};
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

			return hasDefinitionDecoration
				? {
						$ref: `#/definitions/${title}`
				  }
				: definitionObj;
		}
	};

	const schema = makeSchema(theClass);

	return { schema, definitions };
};

export const createSchemaDefinition = (theClass: Function) => {
	if (theClass) {
		const { definitions } = getSchemaDefinition(theClass);
		return definitions;
	}
	return {};
};

export default createSchemaDefinition;
