import { GraphQLObjectType, GraphQLString, GraphQLFloat, GraphQLBoolean, GraphQLList, GraphQLNonNull } from 'graphql';
import _fp from 'lodash/fp';

const scalarDict = {
	number: GraphQLFloat,
	string: GraphQLString,
	boolean: GraphQLBoolean
};

export const getSchema = (theClass: any, schemas = {}) => {
	const makeSchema = (typeOrClass, key?) => {
		const fieldsMetadata = typeOrClass.prototype
			? Reflect.getMetadata('tsgraphql:fields', typeOrClass.prototype)
			: [];
		const metadata = _fp.find({ key }, fieldsMetadata) || ({} as any);

		// it's a primitive type, simple case
		if ([String, Number, Boolean, Date].includes(typeOrClass)) {
			if (typeOrClass === Date) {
				return { type: 'string', format: 'date' };
			}

			const type = scalarDict[typeOrClass.name.toLowerCase()];

			return metadata.opts && metadata.opts.required ? GraphQLNonNull(type) : type;
		}

		// it's an array => recursively call makeSchema on the first array element
		if (Array.isArray(typeOrClass)) {
			return GraphQLList(makeSchema(typeOrClass[0], key));
		}

		// it's a class => create a definition nad recursively call makeSchema on the properties
		if (typeof typeOrClass === 'function' || typeof typeOrClass === 'object') {
			const name: string = metadata.name || typeOrClass.name || key;

			// already exists
			if (schemas[name]) return schemas[name];

			const definitionObj = {
				...metadata.opts,
				name,
				fields: {}
			};

			definitionObj.fields = fieldsMetadata.reduce((acc, { key, opts }) => {
				const type = (opts && opts.type) || Reflect.getMetadata('design:type', typeOrClass.prototype, key);
				acc[key] = makeSchema(type, key);
				return acc;
			}, {});

			// todo: required check

			schemas[name] =
				metadata.opts && metadata.opts.required
					? GraphQLNonNull(new GraphQLObjectType(definitionObj))
					: new GraphQLObjectType(definitionObj);

			return schemas[name];
		}
	};

	const schema = makeSchema(theClass);

	return { schema, schemas };
};

export const generateSchema = (theClass: Function) => {
	if (theClass) {
		const { schemas } = getSchema(theClass);
		return schemas;
	}
	return {};
};

export default generateSchema;
