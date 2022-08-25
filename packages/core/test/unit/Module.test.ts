/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { Module } from '../../src';
import { expect } from '../support/chai';

describe('Module', () => {
	it('should be able to get and set status', () => {
		class MyModule extends Module {
			getModuleId(): string | string[] {
				return 'myModule';
			}
		}

		const module = new MyModule();
		module.setStatus('registering');

		expect(module.getStatus()).to.be.equal('registering');
	});
});
