/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { GraphQLUnionTypeConfig } from 'graphql';
import { ClassType } from '@davinci/reflector';

type ResolveType = GraphQLUnionTypeConfig<{}, {}>['resolveType'];

export class UnionType {
	name: string;

	types: ClassType[];

	resolveType: ResolveType;

	constructor(name: string, types: ClassType[], resolveType: ResolveType) {
		this.name = name;
		this.types = types;
		this.resolveType = resolveType;
	}
}

interface CreateUnionTypeArgs {
	name: UnionType['name'];
	types: UnionType['types'];
	resolveType: UnionType['resolveType'];
}

export const createUnionType = ({ types, resolveType, name }: CreateUnionTypeArgs) =>
	new UnionType(name, types, resolveType);
