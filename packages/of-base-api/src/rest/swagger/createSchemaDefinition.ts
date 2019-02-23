import 'reflect-metadata';
import { SwaggerDefinition, SwaggerDefinitions } from './types';

const getSchemaDefinition = (theClass: Function, definitions = {}): SwaggerDefinitions => {
	const props = Reflect.getMetadata('tsswagger:props', theClass.prototype) || [];
	const definitionMetadata = Reflect.getMetadata('tsswagger:definition', theClass) || {};
	const title: string = definitionMetadata.title || theClass.name;

	definitions[title] = {
		title,
		type: 'object',
		properties: props.reduce((acc, { key, opts }) => {
			let type = (opts && opts.type) || Reflect.getMetadata('design:type', theClass.prototype, key);
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
					acc[key].items.type = type[0].name;
				}

				return acc;
			}

			if (typeof type === 'object' || Date === type) {
				return {
					...acc,
					[key]: {
						type: 'date'
					}
				};
			}

			if (typeof type === 'object' || Object === type) {
				const defs = getSchemaDefinition(type[0]);
				const definition: SwaggerDefinition = defs[Object.keys(defs)[0]];
				definitions[definition.title] = definition;

				return {
					...acc,
					[key]: definition
				};
			}

			return {
				...acc,
				[key]: {
					type: type.name.toLowerCase(),
					...opts
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
	const schemaDef = getSchemaDefinition(theClass);

	return schemaDef;
};

export default createSchemaDefinition;
