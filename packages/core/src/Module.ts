/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import type { App } from './App';

type ClassType = new (...args: any[]) => any;

interface ModuleOptions {
	controllers: ClassType[];
}

export abstract class Module {
	controllers?: ClassType[];

	constructor(options?: ModuleOptions) {
		this.controllers = options?.controllers ?? [];
	}

	/**
	 * @returns {string | string[]} the identifier (or identifiers) of the module
	 */
	abstract getModuleId(): string | string[];

	onRegister?(app: App): void;

	onInit?(app: App): void;

	onDestroy?(app: App): void;
}
