import 'reflect-metadata';

type SwaggerDefinition = {
	type: string;
	description?: string;
	properties?: { [key: string]: SwaggerDefinition };
	required?: string[];
};

export function prop(opts?: any) {
	// this is the decorator factory
	return function(target: Object, key: string | symbol): void {
		// this is the decorator

		// get the existing metadata props
		const props = Reflect.getMetadata('tsswagger:props', target) || [];
		props.push({ key, opts });
		// define new metadata props
		Reflect.defineMetadata('tsswagger:props', props, target);
	};
}

export function definition(opts?: { title }) {
	// this is the decorator factory
	return function(target: Object): void {
		// this is the decorator
		// define new metadata props
		Reflect.defineMetadata('tsswagger:definition', opts, target);
	};
}

const getSchemaDefinition = (theClass: Function): SwaggerDefinition => {
	const props = Reflect.getMetadata('tsswagger:props', theClass.prototype) || [];
	return {
		type: 'object',
		properties: props.reduce((acc, { key, opts }) => {
			const type = Reflect.getMetadata('design:type', theClass.prototype, key);
			return {
				...acc,
				[key]: {
					type: type.name.toLowerCase(),
					...opts
				}
			};
		}, {}),
		required: props.reduce((acc, { key, opts }) => {
			if (opts.required) acc.push(key);

			return acc;
		}, [])
	};
};

export const getDefinition = (theClass: Function) => {
	const schemaDef = getSchemaDefinition(theClass);

	return schemaDef;
};
