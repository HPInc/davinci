/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import 'reflect-metadata';

const getParameterNameCache = new Map();

export default class Reflector {
	static getMetadata<ReturnType = any>(metadataKey: any, target: any, propertyKey?: string | symbol): ReturnType {
		return Reflect.getMetadata(metadataKey, target, propertyKey);
	}

	static defineMetadata(metadataKey: any, metadataValue: any, target: any, propertyKey?: string | symbol) {
		return Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);
	}

	static pushMetadata(metadataKey: any, metadataValue: any, target: any, propertyKey?: string | symbol) {
		const metadata = Reflector.getMetadata(metadataKey, target, propertyKey) || [];
		const newMetadataValue = [...metadata, metadataValue];

		return Reflector.defineMetadata(metadataKey, newMetadataValue, target, propertyKey);
	}

	static unshiftMetadata(metadataKey: any, metadataValue: any, target: any, propertyKey?: string | symbol) {
		const metadata = Reflector.getMetadata(metadataKey, target, propertyKey) || [];
		const newMetadataValue = [metadataValue, ...metadata];

		return Reflector.defineMetadata(metadataKey, newMetadataValue, target, propertyKey);
	}

	static getParameterNames(fn: Function): string[] {
		const cached = getParameterNameCache.get(fn);
		if (cached) return cached;

		// stringify the function and strip out the comments
		const fs = fn.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm, '');

		// first, try and match regular functions
		const result = fs.match(/\(\s*([^]*?)\)\s*\{/)?.[1] ||
			// arrow functions with multiple arguments  like `(arg1, arg2) => {}`
			fs.match(/^\s*\(([^)]*)\)\s*=>/)?.[1] ||
			// arrow functions with single argument without parens like `arg => {}`
			fs.match(/^\s*([^=]*)=>/)?.[1];

		if (!result) return [];
		const parameters = result
			.replace(/\.{3}/gm, '')		// strip rest parameter (...)
			.replace(/=[^,]+/gm, '')	// strip parameter defaults
			.split(',')
			.map(x => x.trim())
			.filter(x => !!x);
		getParameterNameCache.set(fn, parameters);

		return parameters;
	}
}
