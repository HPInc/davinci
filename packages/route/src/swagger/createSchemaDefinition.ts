import _fp from 'lodash/fp';
import { ISwaggerDefinitions } from '../types';

const getSchemaDefinition = (theClass: Function, definitions = {}): ISwaggerDefinitions => {
	const makeSchema = (typeOrClass, key?) => {
		if ([String, Number, Boolean, Date].includes(typeOrClass)) {
			if (typeOrClass === Date) {
				return { type: 'string', format: 'date' };
			}

			return { type: typeOrClass.name.toLowerCase() };
		}

		if (Array.isArray(typeOrClass)) {
			return {
				type: 'array',
				items: makeSchema(typeOrClass[0], key)
			};
		}

		if (typeof typeOrClass === 'object') {
			return {
				type: 'object',
				properties: _fp.map((value, key) => ({ [key]: makeSchema(value) }), typeOrClass)
			};
		}

		if (typeof typeOrClass === 'function') {
			const definitionMetadata = Reflect.getMetadata('tsswagger:definition', typeOrClass);
			const hasDefinitionDecoration = !!definitionMetadata;
			const title: string = hasDefinitionDecoration ? definitionMetadata.title : key || typeOrClass.name;
			const definitionObj = {
				...(definitionMetadata || {}),
				title,
				type: 'object'
			};

			const props = Reflect.getMetadata('tsswagger:props', typeOrClass.prototype) || [];
			definitionObj.properties = props.reduce((acc, { key, opts }) => {
				const type = (opts && opts.type) || Reflect.getMetadata('design:type', typeOrClass.prototype, key);
				acc[key] = makeSchema(type, key);
				return acc;
			}, {});

			definitionObj.required = _fp.flow(
				_fp.filter({ opts: { required: true } }),
				_fp.map('key')
			)(props);

			if (hasDefinitionDecoration) {
				definitions[title] = definitionObj;
				return {
					$ref: title
				};
			}

			return definitionObj;
		}
	};

	makeSchema(theClass);

	return definitions;
};

export const createSchemaDefinition = (theClass: Function) => {
	return theClass ? getSchemaDefinition(theClass) : {};
};

export default createSchemaDefinition;
