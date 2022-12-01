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

function renameClass(theClass: ClassType, newName: string) {
	const nameDescriptors = Object.getOwnPropertyDescriptor(theClass, 'name');
	Object.defineProperty(theClass, 'name', {
		...nameDescriptors,
		value: newName
	});
}

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

export type WalkerIteratorMeta = WalkerIteratorClassMeta | WalkerIteratorPropMeta;

export type WalkerIteratorResult<T = WalkerIteratorMeta> = T & {
	recursive?: boolean;
};

export type WalkerIterator = (
	meta: WalkerIteratorMeta,
	utils: { renameClass: typeof renameClass }
) => Partial<WalkerIteratorResult> | null | undefined;

/**
 * Utility function to walk, inspect and change a class reflection
 * @param type
 * @param iterator
 */
export function walker<T = unknown>(type: ClassType, iterator: WalkerIterator): T {
	const reflection = reflect(type);
	const { name, decorators, properties, methods } = reflection;

	const classIteratorResult = iterator(
		{
			iterationType: 'class',
			name,
			decorators,
			properties,
			methods
		},
		{ renameClass }
	) as WalkerIteratorResult<WalkerIteratorClassMeta>;

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
			iteratorResult: iterator(
				{
					iterationType: 'property',
					name: property.name,
					type: property.type,
					decorators: property.decorators
				},
				{ renameClass }
			) as WalkerIteratorResult<WalkerIteratorPropMeta>
		}))
		.filter(({ iteratorResult }) => !!iteratorResult)
		.forEach(({ property, iteratorResult }) => {
			// iterate decorators
			// eslint-disable-next-line no-unused-expressions
			iteratorResult.decorators?.forEach(d => {
				Reflect.decorate([decorateProperty(d)], NewClass.prototype, property.name);
				// decorateProperty(d)(NewClass, property.name);
			});

			// assign type
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
