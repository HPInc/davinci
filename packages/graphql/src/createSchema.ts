import { GraphQLObjectType, GraphQLString, GraphQLFloat, GraphQLBoolean, GraphQLList } from 'graphql';
import _fp from 'lodash/fp';

const scalarDict = {
	number: GraphQLFloat,
	string: GraphQLString,
	boolean: GraphQLBoolean
};

export const getSchema = (theClass: Function, definitions = {}) => {
	const makeSchema = (typeOrClass, key?) => {
		// it's a primitive type, simple case
		if ([String, Number, Boolean, Date].includes(typeOrClass)) {
			if (typeOrClass === Date) {
				return { type: 'string', format: 'date' };
			}

			return scalarDict[typeOrClass.name.toLowerCase()];
		}

		// it's an array => recursively call makeSchema on the first array element
		if (Array.isArray(typeOrClass)) {
			return GraphQLList(makeSchema(typeOrClass[0], key));
		}

		// it's a class => create a definition nad recursively call makeSchema on the properties
		if (typeof typeOrClass === 'function' || typeof typeOrClass === 'object') {
			const metadata = Reflect.getMetadata('tsgraphql:object', typeOrClass);
			const hasMetadata = !!metadata;

			const name: string = hasMetadata ? metadata.name : key || typeOrClass.name;
			const definitionObj = {
				name,
				fields: {}
				/*
				...(metadata || {}),
				type: 'object'
			*/
			};
			if (hasMetadata) {
				if (definitions[name]) {
					return name;
				}
			}

			const props = Reflect.getMetadata('tsgraphql:props', typeOrClass.prototype) || [];
			const properties = props.reduce((acc, { key, opts }) => {
				const type = (opts && opts.type) || Reflect.getMetadata('design:type', typeOrClass.prototype, key);
				acc[key] = makeSchema(type, key);
				return acc;
			}, {});

			if (!_fp.isEmpty(properties)) {
				definitionObj.fields = properties;
			}

			// todo: required check

			definitions[name] = new GraphQLObjectType(definitionObj);

			return definitions[name];
		}
	};

	const schema = makeSchema(theClass);

	return { schema, definitions };
};

export const generateSchema = (theClass: Function) => {
	if (theClass) {
		const { definitions } = getSchema(theClass);
		return definitions;
	}
	return {};
};

export default generateSchema;
