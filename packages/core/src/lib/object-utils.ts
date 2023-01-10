/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

export function mapObject<T extends object, TResult>(
	obj: T,
	iteratee: (value: T[keyof T], key: keyof T) => TResult
): { [P in keyof T]: TResult } {
	const keys = Object.keys(obj) as Array<keyof T>;

	return keys.reduce((acc, key) => {
		const value = obj[key];
		acc[key] = iteratee(value, key);
		return acc;
	}, {} as { [P in keyof T]: TResult });
}

export function omit<T extends object | null | undefined>(obj: T, keys: (keyof T)[]): Partial<T> {
	if (!keys.length) return obj;
	if (typeof obj !== 'object' || typeof obj === 'undefined' || obj === null) return obj;
	const objKeys = Object.keys(obj) as Array<keyof T>;

	return objKeys.reduce((acc, key) => {
		if (keys.indexOf(key) === -1) {
			acc[key] = obj[key];
		}

		return acc;
	}, {} as Partial<T>);
}

/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

function isObject(o: unknown) {
	return Object.prototype.toString.call(o) === '[object Object]';
}

export function isPlainObject(o: unknown) {
	if (isObject(o) === false) return false;
	const obj = o as object;

	// If it has modified constructor
	const ctor = obj.constructor;
	if (ctor === undefined) return true;

	// If it has modified prototype
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;

	// if constructor does not have an Object-specific method
	// eslint-disable-next-line no-prototype-builtins
	if (prot.hasOwnProperty('isPrototypeOf') === false) {
		return false;
	}

	// Most likely a plain Object
	return true;
}
