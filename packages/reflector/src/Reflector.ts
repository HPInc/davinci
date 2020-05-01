/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import 'reflect-metadata';

const getParameterNameCache = new Map();

// logic from https://github.com/goatslacker/get-parameter-names
function cleanUp(fn: string) {
	return (
		fn
			// strive comments
			.replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm, '')
			// strive rest parameter
			.replace(/\.{3}/gm, '')
			// strive lambda
			.replace(/=>.*$/gm, '')
			// strive default params
			.replace(/=[^,]+/gm, '')
	);
}

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

	static getParameterNames(fn: Function) {
		const cached = getParameterNameCache.get(fn);
		if (cached) return cached;

		const regex = /\(\s*([^]*?)\)\s*\{/gm;
		const result = regex.exec(fn.toString());
		if (!result) return [];
		const match = cleanUp(result![1]);
		const parameters = match
			.split(',')
			.map(x => x.trim())
			.filter(x => !!x);
		getParameterNameCache.set(fn, parameters);

		return parameters;
	}
}
