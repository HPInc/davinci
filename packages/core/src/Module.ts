/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import type { App } from './App';

export type ModuleStatus = 'unloaded' | 'initializing' | 'initialized' | 'destroying' | 'destroyed' | 'error';

export abstract class Module {
	/**
	 * @returns {string | string[]} the identifier (or identifiers) of the module
	 */
	abstract getModuleId(): string | string[];

	onInit?(app: App): unknown | Promise<unknown>;

	onDestroy?(app: App): unknown | Promise<unknown>;
}
