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

interface IGenerateGQLSchemaArgs {
	type: any;
	parentType?: any;
	key?: any;
	isInput?: boolean;
	schemas?: { [key: string]: any };
	transformMetadata?: Function;
}

const getFieldsMetadata = (target: Function, isInput: boolean): IFieldDecoratorMetadata[] => {
	const fieldsMetadata = _.filter(
		Reflector.getMetadata('davinci:graphql:fields', target) as IFieldDecoratorMetadata[],
		isInput ? { opts: { asInput: true } } : _.identity
	);

	const inputFieldsMetadata = isInput
		? (Reflector.getMetadata('davinci:graphql:input-fields', target) as IFieldDecoratorMetadata[])
		: [];

	return _.concat(fieldsMetadata, inputFieldsMetadata || []) as IFieldDecoratorMetadata[];
};

export const generateGQLSchema = ({
	type,
	parentType,
	key,
	schemas = {},
	isInput = false,
	transformMetadata = _.identity
}: IGenerateGQLSchemaArgs) => {
	// grab meta infos
	// maybe it's a decorated class, let's try to get the fields metadata
	const parentFieldsMetadata: IFieldDecoratorMetadata[] =
		parentType && parentType.prototype
			? getFieldsMetadata(parentType.prototype.constructor, isInput)
			: [];
	const meta = _fp.find({ key }, parentFieldsMetadata) || ({} as IFieldDecoratorMetadata);
	const metadata = transformMetadata(meta, { isInput, type, parentType, schemas });
	const isRequired = metadata.opts && metadata.opts.required;

	// it's a primitive type, simple case
	if ([String, Number, Boolean, Date].includes(type)) {
		const gqlType = type === Date ? GraphQLDateTime : scalarDict[type.name.toLowerCase()];
		const schema = isRequired ? GraphQLNonNull(gqlType) : gqlType;
		return { schema, schemas };
	}

	// it's an array => recursively call makeSchema on the first array element
	if (Array.isArray(type)) {
		const gqlSchema = generateGQLSchema({
			type: type[0],
			parentType,
			schemas,
			key,
			isInput,
			transformMetadata
		});
		const gqlType = GraphQLList(gqlSchema.schema);
		const schema = isRequired ? GraphQLNonNull(gqlType) : gqlType;

		return { schema, schemas: _.merge(schemas, gqlSchema.schemas) };
	}

	// it's a complex type => create nested types
	if (typeof type === 'function' || typeof type === 'object') {
		const suffix = isInput ? 'Input' : '';
		const typeMetadata = Reflector.getMetadata('davinci:graphql:types', type) || {};
		const name: string = `${typeMetadata.name || type.name || key}${suffix}`;

		// existing type, let's return it
		if (schemas[name]) {
			return { schema: schemas[name], schemas };
		}

		const objTypeConfig: any = {
			...metadata.opts,
			name,
			fields: createObjectFields({ parentType: type, schemas, isInput, transformMetadata })
		};

		const ObjectType = isInput ? GraphQLInputObjectType : GraphQLObjectType;

		schemas[name] =
			metadata.opts && metadata.opts.required
				? GraphQLNonNull(new ObjectType(objTypeConfig))
				: new ObjectType(objTypeConfig);

		return { schema: schemas[name], schemas };
	}
};

interface ICreateObjectFieldsArgs {
	parentType: any;
	isInput?: boolean;
	schemas?: { [key: string]: any };
	transformMetadata?: Function;
}

const createObjectFields = ({
	parentType,
	schemas = {},
	isInput,
	transformMetadata = _.identity
}: ICreateObjectFieldsArgs) => {
	const fieldsMetadata: IFieldDecoratorMetadata[] = getFieldsMetadata(
		parentType.prototype.constructor,
		isInput
	);

	const externalFieldsResolvers =
		Reflector.getMetadata('davinci:graphql:field-resolvers', parentType.prototype.constructor) || [];

	return () => {
		const fields = fieldsMetadata.reduce((acc, meta) => {
			const { key, opts } = transformMetadata(meta, { isInput, parentType, schemas });
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

			const hasResolverFunction =
				parentType.prototype && typeof parentType.prototype[key] === 'function';

			if (hasResolverFunction && !isInput) {
				acc[key].resolve = parentType.prototype[key];
			}

			return acc;
		}, {});

		const fieldsWithExternalResolver = isInput
			? {}
			: externalFieldsResolvers.reduce((acc, fieldMeta) => {
					const { prototype, fieldName } = fieldMeta;
					const { schema, schemas: s } = createExecutableSchema(
						prototype.constructor,
						fieldMeta,
						schemas
					);
					_.merge(schemas, s);

					acc[fieldName] = schema;
					return acc;
			  }, {});

		return { ...fields, ...fieldsWithExternalResolver };
	};
};

export default generateGQLSchema;
