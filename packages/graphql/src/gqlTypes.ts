import { GraphQLUnionTypeConfig } from 'graphql';

type Types = GraphQLUnionTypeConfig<{}, {}>['types'];

type ResolveType = GraphQLUnionTypeConfig<{}, {}>['resolveType'];

export class UnionType {
	types: Types;

	resolveType: ResolveType;

	constructor(types: Types, resolveType: ResolveType) {
		this.types = types;
		this.resolveType = resolveType;
	}
}
export const createUnionType = ({ types, resolveType }: { types: Types; resolveType: ResolveType }) =>
	new UnionType(types, resolveType);
