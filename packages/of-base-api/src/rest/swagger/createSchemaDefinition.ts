import 'reflect-metadata';
import _ from 'lodash';
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
				const isFunction =
					![String, Number, Object, Boolean, Date].includes(type[0]) && typeof type[0] === 'function';

				acc[key] = {
					type: 'array',
					items: {}
				};
				const definitionMetadata = Reflect.getMetadata('tsswagger:definition', type[0]) || {};
				const title: string = definitionMetadata.title || type[0].name;
				if (isFunction) {
					const defs = getSchemaDefinition(type[0], definitions);
					const definition: SwaggerDefinition = defs[Object.keys(defs)[0]];
					definitions[definition.title] = definition;
					acc[key].items.$ref = title;
				} else {
					acc[key].items.type = type[0].name.toLowerCase();
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

			return {
				...acc,
				[key]: {
					..._.omit(opts, ['required']),
					type: type.name.toLowerCase()
				}
			};
		}, {}),
		required: props.reduce((acc, { key, opts }) => {
			if (opts && opts.required) acc.push(key);

			return acc;
		}, [])
	};

	return definitions;
};

export const createSchemaDefinition = (theClass: Function) => {
	return theClass ? getSchemaDefinition(theClass) : {};
};

export default createSchemaDefinition;
