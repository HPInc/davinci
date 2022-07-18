/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

export function mapObject<T extends object>(obj: object, iteratee: (value: unknown, key: string) => unknown): T;
export function mapObject(obj: object, iteratee: (value: unknown, key: string) => unknown) {
	return Object.keys(obj).reduce((acc, key) => {
		const value = obj[key];
		acc[key] = iteratee(value, key);

		return acc;
	}, {});
}
