import 'reflect-metadata';
import _fp from 'lodash/fp';
import { SwaggerDefinition, SwaggerDefinitions } from './types';

const getSchemaDefinition = (theClass: Function, definitions = {}): SwaggerDefinitions => {
	const props = Reflect.getMetadata('tsswagger:props', theClass.prototype) || [];
	const definitionMetadata = Reflect.getMetadata('tsswagger:definition', theClass) || {};
	const title: string = definitionMetadata.title || theClass.name;

	definitions[title] = {
		title,
		type: 'object',
		properties: props.reduce((acc, { key, opts }) => {
			const type = (opts && opts.type) || Reflect.getMetadata('design:type', theClass.prototype, key);
			const isFunction = ![String, Number, Object, Boolean, Date].includes(type) && typeof type === 'function';

			if (isFunction) {
				const defs = getSchemaDefinition(type, definitions);
				const definition: SwaggerDefinition = defs[Object.keys(defs)[0]];
				definitions[definition.title] = definition;
				acc[key] = { $ref: definition.title };

				return acc;
			}

			if (Array.isArray(type)) {
				acc[key] = {
					type: 'array',
					items: {}
				};

				const isFunction =
					![String, Number, Object, Boolean, Date].includes(type[0]) && typeof type[0] === 'function';

				const def = getSchemaDefinition(type[0], definitions);
				const schema = def[Object.keys(def)[0]];
				if (isFunction) {
					definitions[schema.title] = schema;
					acc[key].items.$ref = schema.title;
				} else {
					acc[key].items = { ...schema };
				}

				return acc;
			}

			if (typeof type === 'object' || Date === type) {
				return {
					...acc,
					[key]: {
						type: 'string',
						format: 'date'
					}
				};
			}

			// is object
			return {
				...acc,
				[key]: {
					..._fp.omit(['required'], opts),
					type: type.name.toLowerCase()
				}
			};
		}, {}),
		required: _fp.flow(
			_fp.filter({ opts: { required: true } }),
			_fp.map('key')
		)(props)
	};

	return definitions;
};

export const createSchemaDefinition = (theClass: Function) => {
	return theClass ? getSchemaDefinition(theClass) : {};
};

export default createSchemaDefinition;
