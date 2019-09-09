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

interface IGetGQLSchemaArgs {
	type: any;
	parentType?: any;
	key?: any;
	isInput?: boolean;
	schemas?: { [key: string]: any };
	transformMetadata?: Function;
}

export const generateGQLSchema = ({
	type,
	parentType,
	key,
	schemas = {},
	isInput,
	transformMetadata = _.identity
}: IGetGQLSchemaArgs) => {
	// grab meta infos
	// maybe it's a decorated class, let's try to get the fields metadata
	const parentFieldsMetadata: IFieldDecoratorMetadata[] =
		parentType && parentType.prototype ? Reflector.getMetadata('tsgraphql:fields', parentType.prototype) || [] : [];
	const metadata = (_fp.find({ key }, parentFieldsMetadata) || {}) as IFieldDecoratorMetadata;
	const isRequired = metadata.opts && metadata.opts.required;

	// it's a primitive type, simple case
	if ([String, Number, Boolean, Date].includes(type)) {
		const gqlType = type === Date ? GraphQLDateTime : scalarDict[type.name.toLowerCase()];
		const schema = isRequired ? GraphQLNonNull(gqlType) : gqlType;
		return { schema, schemas };
	}

	// it's an array => recursively call makeSchema on the first array element
	if (Array.isArray(type)) {
		const gqlSchema = generateGQLSchema({ type: type[0], parentType, schemas, key, isInput, transformMetadata });
		const gqlType = GraphQLList(gqlSchema.schema);
		const schema = isRequired ? GraphQLNonNull(gqlType) : gqlType;

		return { schema, schemas: _.merge(schemas, gqlSchema.schemas) };
	}

	// it's a complex type => create nested types
	if (typeof type === 'function' || typeof type === 'object') {
		const suffix = isInput ? 'Input' : '';
		const name: string = `${type.name || key}${suffix}`;

		// existing type, let's return it
		if (schemas[name]) {
			return { schema: schemas[name], schemas };
		}

		const ObjectType = isInput ? GraphQLInputObjectType : GraphQLObjectType;
		const parentType = type;

		const fieldsMetadata: IFieldDecoratorMetadata[] =
			Reflector.getMetadata('tsgraphql:fields', parentType.prototype) || [];

		const externalFieldsResolvers = Reflector.getMetadata('tsgraphql:field-resolvers', type.prototype) || [];

		const objTypeConfig: any = {
			...metadata.opts,
			name,
			fields: () => {
				const fields = fieldsMetadata.reduce((acc, { key, opts }) => {
					let type;
					if (opts && typeof opts.typeFactory === 'function') {
						type = opts.typeFactory();
					} else if (opts && opts.type) {
						type = opts.type;
					}

					const gqlSchema = generateGQLSchema({
						type,
						key,
						isInput,
						parentType,
						schemas,
						transformMetadata
					});
					acc[key] = { type: gqlSchema.schema };
					_.merge(schemas, gqlSchema.schemas);

					const hasResolverFunction = parentType.prototype && typeof parentType.prototype[key] === 'function';

					if (hasResolverFunction && !isInput) {
						acc[key].resolve = parentType.prototype[key];
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
				? GraphQLNonNull(new ObjectType(objTypeConfig))
				: new ObjectType(objTypeConfig);

		return { schema: schemas[name], schemas };
	}
};

export default generateGQLSchema;
