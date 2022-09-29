/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { EventEmitter } from 'events';
import type { App } from './App';

export type ModuleStatus =
	| 'unloaded'
	| 'registering'
	| 'registered'
	| 'initializing'
	| 'initialized'
	| 'destroying'
	| 'destroyed'
	| 'error';

const statusSym = Symbol('status');

export abstract class Module {
	[statusSym]: ModuleStatus = 'unloaded';
	eventBus = new EventEmitter();

	/**
	 * @returns {string | string[]} the identifier (or identifiers) of the module
	 */
	abstract getModuleId(): string | string[];

	onRegister?(app: App): unknown | Promise<unknown>;

	onInit?(app: App): unknown | Promise<unknown>;

	onDestroy?(app: App): unknown | Promise<unknown>;

	public setStatus(newStatus: ModuleStatus) {
		this[statusSym] = newStatus;
		const eventName = newStatus === 'error' ? 'module-error' : newStatus;
		this.eventBus.emit(eventName);
	}

	public getStatus() {
		return this[statusSym];
	}
}
