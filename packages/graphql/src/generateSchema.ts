import {
	GraphQLObjectType,
	GraphQLString,
	GraphQLFloat,
	GraphQLBoolean,
	GraphQLList,
	GraphQLNonNull,
	GraphQLInputObjectType
} from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';
import _fp from 'lodash/fp';
import _ from 'lodash';
import { Reflector } from '@davinci/reflector';
import { IFieldDecoratorMetadata } from './types';
import { createExecutableSchema } from './createControllerSchemas';

const scalarDict = {
	number: GraphQLFloat,
	string: GraphQLString,
	boolean: GraphQLBoolean
};

const defaultOptions = {
	isInput: false
};

export const getSchema = (theClass: any, schemas = {}, options?) => {
	const { isInput } = _.merge({}, defaultOptions, options);
	const ObjectType = isInput ? GraphQLInputObjectType : GraphQLObjectType;

	const makeSchema = (typeOrClass, key?) => {
		// maybe it's a decorated class, let's try to get the fields metadata
		const fieldsMetadata: IFieldDecoratorMetadata[] = typeOrClass.prototype
			? Reflector.getMetadata('tsgraphql:fields', typeOrClass.prototype) || []
			: [];
		const metadata = (_fp.find({ key }, fieldsMetadata) || {}) as IFieldDecoratorMetadata;
		const isRequired = metadata.opts && metadata.opts.required;

		// it's a primitive type, simple case
		if ([String, Number, Boolean, Date].includes(typeOrClass)) {
			const gqlType = typeOrClass === Date ? GraphQLDateTime : scalarDict[typeOrClass.name.toLowerCase()];
			return isRequired ? GraphQLNonNull(gqlType) : gqlType;
		}

		// it's an array => recursively call makeSchema on the first array element
		if (Array.isArray(typeOrClass)) {
			const gqlType = GraphQLList(makeSchema(typeOrClass[0], key));
			return isRequired ? GraphQLNonNull(gqlType) : gqlType;
		}

		// it's a class => create a definition nad recursively call makeSchema on the properties
		if (typeof typeOrClass === 'function' || typeof typeOrClass === 'object') {
			const suffix = isInput ? 'Input' : '';
			const name: string = `${metadata.key || typeOrClass.name || key}${suffix}`;

			// already exists
			if (schemas[name]) return schemas[name];

			const typeClass = Array.isArray(theClass) ? theClass[0] : theClass;
			const externalFieldsResolvers =
				Reflector.getMetadata('tsgraphql:field-resolvers', typeClass.prototype) || [];

			const definitionObj: any = {
				...metadata.opts,
				name,
				fields: () => {
					const fields = fieldsMetadata.reduce((acc, { key, opts }) => {
						let type;
						if (opts && typeof opts.typeFactory === 'function') {
							type = opts.typeFactory();
						} else if (opts && opts.type) {
							type = opts.type;
						} else {
							type = Reflector.getMetadata('design:type', typeOrClass.prototype, key);
						}

						const gqlType = makeSchema(type, key);
						acc[key] = { type: gqlType };

						const hasResolverFunction =
							typeClass.prototype && typeof typeClass.prototype[key] === 'function';

						if (hasResolverFunction && !isInput) {
							acc[key].resolve = typeClass.prototype[key];
						}

						return acc;
					}, {});

					const fieldsWithExternalResolver = isInput
						? {}
						: externalFieldsResolvers.reduce((acc, fieldMeta) => {
								const { target, fieldName } = fieldMeta;
								const { schema, schemas: s } = createExecutableSchema(
									target.constructor,
									fieldMeta,
									schemas
								);
								_.merge(schemas, s);

								acc[fieldName] = schema;
								return acc;
						  }, {});

					return { ...fields, ...fieldsWithExternalResolver };
				}
			};

			schemas[name] =
				metadata.opts && metadata.opts.required
					? GraphQLNonNull(new ObjectType(definitionObj))
					: new ObjectType(definitionObj);

			return schemas[name];
		}
	};

	const schema = makeSchema(theClass);

	return { schema, schemas };
};

const generateSchema = (theClass: Function) => {
	if (theClass) {
		const { schemas } = getSchema(theClass);
		return schemas;
	}
	return {};
};

export default generateSchema;
