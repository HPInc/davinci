/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

type Iterable<T> = (item: T, index: number) => void;

export async function mapSeries<T = unknown>(data: T[], fn: Iterable<T>) {
	const results = [];
	for (let index = 0; index < data.length; index++) {
		const item = data[index];
		// eslint-disable-next-line
		results.push(await fn(item, index));
	}

	return results;
}

export async function mapParallel<T = unknown>(data: T[], fn: Iterable<T>) {
	return Promise.all(data.map((item, index) => fn(item, index)));
}
