import 'reflect-metadata';

type SwaggerDefinition = {
	title: string;
	type: string;
	description?: string;
	properties?: { [key: string]: SwaggerDefinition };
	required?: string[];
};

type SwaggerDefinitions = {
	[key: string]: SwaggerDefinition;
};

const getSchemaDefinition = (theClass: Function): SwaggerDefinitions => {
	const props = Reflect.getMetadata('tsswagger:props', theClass.prototype) || [];
	const definitionMetadata = Reflect.getMetadata('tsswagger:definition', theClass) || {};
	const title: string = definitionMetadata.title || theClass.name;

	const definitions = {};
	definitions[title] = {
		title,
		type: 'object',
		properties: props.reduce((acc, { key, opts }) => {
			const type = (opts && opts.type) || Reflect.getMetadata('design:type', theClass.prototype, key);
			if (Array.isArray(type)) {
				const defs = getSchemaDefinition(type[0]);
				const definition: SwaggerDefinition = defs[Object.keys(defs)[0]];
				definitions[definition.title] = definition;

				return {
					...acc,
					[key]: {
						title: definition.title,
						type: 'array',
						schema: { $ref: `#/${definition.title}` }
					}
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
