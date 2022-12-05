/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

export function mapObject<T extends object>(obj: T, iteratee: (value: T[keyof T], key: keyof T) => unknown): T;
export function mapObject(obj: object, iteratee: (value, key: string) => unknown) {
	return Object.keys(obj).reduce((acc, key) => {
		const value = obj[key];
		acc[key] = iteratee(value, key);

		return acc;
	}, {});
}

export function omit<T extends object>(obj: T, keys: (keyof T)[]): Partial<T>;
export function omit(obj: object, keys: string[]) {
	if (!keys.length) return obj;
	if (typeof obj !== 'object' || obj === null) return obj;

	return Object.keys(obj).reduce((acc, key) => {
		if (keys.indexOf(key) === -1) {
			acc[key] = obj[key];
		}

		return acc;
	}, {});
}

/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

function isObject(o) {
	return Object.prototype.toString.call(o) === '[object Object]';
}

export function isPlainObject(o) {
	if (isObject(o) === false) return false;

	// If it has modified constructor
	const ctor = o.constructor;
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
