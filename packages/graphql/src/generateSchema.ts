/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import {
	GraphQLObjectType,
	GraphQLString,
	GraphQLFloat,
	GraphQLBoolean,
	GraphQLList,
	GraphQLNonNull,
	GraphQLInputObjectType,
	GraphQLUnionType
} from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLJSON } from 'graphql-type-json';
import _fp from 'lodash/fp';
import _ from 'lodash';
import { Reflector } from '@davinci/reflector';
import { IExternalFieldResolverDecoratorMetadata, IFieldDecoratorMetadata, IResolverDecoratorMetadata, OperationType } from './types';
import { UnionType } from './gqlTypes';
import { createExecutableSchema } from './createControllerSchemas';

const scalarDict = {
	number: GraphQLFloat,
	string: GraphQLString,
	boolean: GraphQLBoolean,
	object: GraphQLJSON,
	date: GraphQLDateTime
};

interface IGenerateGQLSchemaArgs {
	type: any;
	parentType?: any;
	key?: any;
	isInput?: boolean;
	operationType?: OperationType;
	resolverMetadata?: IResolverDecoratorMetadata;
	partial?: boolean;
	schemas?: { [key: string]: any };
	transformMetadata?: Function;
}

const getFieldsMetadata = (
	target: Function,
	isInput: boolean,
	operationType?: OperationType,
	resolverMetadata?: IResolverDecoratorMetadata
): IFieldDecoratorMetadata[] => {
	const fieldsMetadata = _.map(
		Reflector.getMetadata('davinci:graphql:fields', target) as IFieldDecoratorMetadata[],
		({ key, optsFactory }) => ({ key, opts: optsFactory({ isInput, operationType, resolverMetadata }) })
	);

	return fieldsMetadata;
};

export const generateGQLSchema = ({
	type,
	parentType,
	key,
	schemas = {},
	isInput = false,
	operationType,
	resolverMetadata,
	partial,
	transformMetadata = _.identity
}: IGenerateGQLSchemaArgs) => {
	// grab meta infos
	// maybe it's a decorated class, let's try to get the fields metadata
	const parentFieldsMetadata: IFieldDecoratorMetadata[] = parentType?.prototype
		? getFieldsMetadata(parentType.prototype.constructor, isInput, operationType, resolverMetadata)
		: [];
	const meta = _fp.find({ key }, parentFieldsMetadata) || ({} as IFieldDecoratorMetadata);
	const metadata = transformMetadata(meta, { isInput, type, parentType, schemas });
	const isRequired = !partial && metadata.opts?.required;

	// it's a primitive type, simple case
	if ([String, Number, Boolean, Date, Object].includes(type)) {
		const gqlType = scalarDict[type.name.toLowerCase()];
		const schema = isRequired ? new GraphQLNonNull(gqlType) : gqlType;
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
			operationType,
			resolverMetadata,
			partial,
			transformMetadata
		});
		const gqlType = new GraphQLList(gqlSchema.schema);
		const schema = isRequired ? new GraphQLNonNull(gqlType) : gqlType;

		return { schema, schemas: _.merge(schemas, gqlSchema.schemas) };
	}

	// it's a complex type => create nested types
	if (typeof type === 'function' || typeof type === 'object') {
		const suffix = isInput
			? _.compact([partial && 'Partial', _.upperFirst(operationType || ''), 'Input']).join('')
			: '';
		const typeMetadata = Reflector.getMetadata('davinci:graphql:types', type) || {};
		const name = `${typeMetadata.name || type.name || key}${suffix}`;

		// existing type, let's return it
		if (schemas[name]) {
			return { schema: schemas[name], schemas };
		}

		if (type instanceof UnionType) {
			const types = Array.isArray(type.types)
				? type.types.map(
					t =>
						generateGQLSchema({
							type: t,
							parentType,
							schemas,
							key,
							isInput,
							operationType,
							resolverMetadata,
							partial,
							transformMetadata
						}).schema
				  )
				: type.types;

			const unionTypeConfig = {
				..._.omit(metadata.opts, ['type']),
				name,
				types,
				resolveType: type.resolveType
			};

			schemas[name] = isRequired
				? new GraphQLNonNull(new GraphQLUnionType(unionTypeConfig))
				: new GraphQLUnionType(unionTypeConfig);
		} else {
			const objTypeConfig: any = {
				...metadata.opts,
				name,

				// eslint-disable-next-line no-use-before-define
				fields: createObjectFields({
					parentType: type,
					schemas,
					isInput,
					operationType,
					resolverMetadata,
					partial,
					transformMetadata
				})
			};

			const ObjectType = isInput ? GraphQLInputObjectType : GraphQLObjectType;
			schemas[name] = isRequired
				? new GraphQLNonNull(new ObjectType(objTypeConfig))
				: new ObjectType(objTypeConfig);
		}

		return { schema: schemas[name], schemas };
	}

	return null;
};

interface ICreateObjectFieldsArgs {
	parentType: any;
	isInput?: boolean;
	operationType?: OperationType;
	resolverMetadata?: IResolverDecoratorMetadata;
	partial?: boolean;
	schemas?: { [key: string]: any };
	transformMetadata?: Function;
}

const createObjectFields = ({
	parentType,
	schemas = {},
	isInput,
	operationType,
	resolverMetadata,
	partial,
	transformMetadata = _.identity
}: ICreateObjectFieldsArgs) => {
	const fieldsMetadata: IFieldDecoratorMetadata[] = getFieldsMetadata(
		parentType.prototype.constructor,
		isInput,
		operationType,
		resolverMetadata
	);

	const externalFieldsResolvers: IExternalFieldResolverDecoratorMetadata[] =
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
				operationType,
				resolverMetadata,
				parentType,
				schemas,
				transformMetadata,
				partial
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
				const { prototype, fieldName } = fieldMeta;
				const { schema, schemas: s } = createExecutableSchema(
					prototype.constructor,
					fieldMeta,
					schemas,
					operationType
				);
				_.merge(schemas, s);

				acc[fieldName] = schema;
				return acc;
			  }, {});

		return { ...fields, ...fieldsWithExternalResolver };
	};
};

export default generateGQLSchema;
