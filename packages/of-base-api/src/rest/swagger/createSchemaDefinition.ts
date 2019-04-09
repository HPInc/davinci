import _fp from 'lodash/fp';
import { SwaggerDefinitions } from './types';

const getSchemaDefinition = (theClass: Function, definitions = {}): SwaggerDefinitions => {
	const makeSchema = typeOrClass => {
		if ([String, Number, Boolean, Date].includes(typeOrClass)) {
			if (typeOrClass === Date) {
				return { type: 'string', format: 'date' };
			}

			return { type: typeOrClass.name.toLowerCase() };
		}

		if (Array.isArray(typeOrClass)) {
			return {
				type: 'array',
				items: makeSchema(typeOrClass[0])
			};
		}

		if (typeof typeOrClass === 'object') {
			return {
				type: 'object',
				properties: _fp.map((value, key) => ({ [key]: makeSchema(value) }), typeOrClass)
			};
		}

		if (typeof typeOrClass === 'function') {
			const definitionMetadata = Reflect.getMetadata('tsswagger:definition', typeOrClass) || {};
			const title: string = definitionMetadata.title || typeOrClass.name;
			definitions[title] = {
				...definitionMetadata,
				title,
				type: 'object'
			};
			const props = Reflect.getMetadata('tsswagger:props', typeOrClass.prototype) || [];
			definitions[title].properties = props.reduce((acc, { key, opts }) => {
				const type = (opts && opts.type) || Reflect.getMetadata('design:type', typeOrClass.prototype, key);
				acc[key] = makeSchema(type);
				return acc;
			}, {});

			definitions[title].required = _fp.flow(
				_fp.filter({ opts: { required: true } }),
				_fp.map('key')
			)(props);

			return {
				$ref: title
			};
		}
	};

	makeSchema(theClass);

	return definitions;
};

export const createSchemaDefinition = (theClass: Function) => {
	return theClass ? getSchemaDefinition(theClass) : {};
};

export default createSchemaDefinition;
