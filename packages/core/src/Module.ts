/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import type { App } from './App';

export abstract class Module {
	/**
	 * @returns {string | string[]} the identifier (or identifiers) of the module
	 */
	abstract getModuleId(): string | string[];

	onInit?(app: App): void;

	onDestroy?(app: App): void;
}
