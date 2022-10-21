/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import 'reflect-metadata';

export {
	reflect,
	decorateClass,
	decorateMethod,
	decorateProperty,
	decorateParameter,
	decorate,
	ObjectReflection,
	ClassReflection,
	MethodReflection,
	PropertyReflection,
	DecoratorId,
	type
} from '@plumier/reflect';

const ReflectMetadata = Reflect;

export { ReflectMetadata as Reflect };
