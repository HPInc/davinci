/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassType } from '@davinci/reflector';

export const primitiveTypes = [String, Number, Boolean, Date] as unknown[];

export const isPrimitiveType = (type: unknown) => primitiveTypes.includes(type);

export const capitalizeFirstLetter = (string: string) => {
	return string.charAt(0).toUpperCase() + string.slice(1);
};

export const renameClass = (theClass: ClassType, newName: string) => {
	const nameDescriptors = Object.getOwnPropertyDescriptor(theClass, 'name');
	Object.defineProperty(theClass, 'name', {
		...nameDescriptors,
		value: newName
	});
};
