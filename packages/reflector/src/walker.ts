/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import {
	ClassType,
	decorateProperty,
	MethodReflection,
	PropertyReflection,
	reflect,
	Reflect,
	type as typeDecorator
} from './index';

// type IterationType = 'class' | 'property' | 'method' | 'decorator';

interface WalkerIteratorClassMeta {
	iterationType: 'class';
	name: string;
	decorators: any[];
	properties: PropertyReflection[];
	methods: MethodReflection[];
}

interface WalkerIteratorPropMeta {
	iterationType: 'property';
	name: string;
	decorators: any[];
	type?: any;
}

/* type IterationResult<T> = T extends 'class'
	? WalkerIteratorClassMeta
	: T extends 'property'
	? WalkerIteratorPropMeta
	: never; */

export type WalkerIteratorMeta = WalkerIteratorClassMeta | WalkerIteratorPropMeta;

export type WalkerIteratorResult<T = WalkerIteratorMeta> = T & {
	recursive?: boolean;
};

export type WalkerIterator = (meta: WalkerIteratorMeta) => Partial<WalkerIteratorResult> | null | undefined;

export function walker<T = unknown>(type: ClassType, iterator: WalkerIterator): T {
	const reflection = reflect(type);
	const { name, decorators, properties, methods } = reflection;

	const classIteratorResult = iterator({
		iterationType: 'class',
		name,
		decorators,
		properties,
		methods
	}) as WalkerIteratorResult<WalkerIteratorClassMeta>;

	// stop processing
	if (!classIteratorResult) {
		return null;
	}

	// create new class to return
	const NewClass = reflect.create({}, { name: classIteratorResult.name });

	// assign name
	const nameDescriptors = Object.getOwnPropertyDescriptor(NewClass, 'name');
	Object.defineProperty(NewClass, 'name', { ...nameDescriptors, value: classIteratorResult.name });

	// iterate through properties
	// eslint-disable-next-line no-unused-expressions
	classIteratorResult?.properties
		?.map(property => ({
			property,
			iteratorResult: iterator({
				iterationType: 'property',
				name: property.name,
				type: property.type,
				decorators: property.decorators
			}) as WalkerIteratorResult<WalkerIteratorPropMeta>
		}))
		.filter(({ iteratorResult }) => !!iteratorResult)
		.forEach(({ property, iteratorResult }) => {
			// eslint-disable-next-line no-unused-expressions
			iteratorResult.decorators?.forEach(d => {
				Reflect.decorate([decorateProperty(d)], NewClass.prototype, property.name);
				// decorateProperty(d)(NewClass, property.name);
			});

			if (iteratorResult.type ?? property.type) {
				Reflect.decorate(
					[typeDecorator(iteratorResult.type ?? property.type)],
					NewClass.prototype,
					property.name
				);
			}
		});

	return NewClass as unknown as T;
}
