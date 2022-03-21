/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { App } from './App';

type ClassType = new (...args: any[]) => any;

interface ModuleOptions {
	controllers: ClassType[];
}

export abstract class Module {
	controllers?: ClassType[];

	constructor(options?: ModuleOptions) {
		this.controllers = options?.controllers ?? [];
	}

	abstract getModuleId(): string;

	abstract onRegister?(app: App): void;

	abstract onInit?(app: App): void;

	abstract onDestroy?(app: App): void;
}
