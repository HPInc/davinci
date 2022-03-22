/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import should from 'should';
import sinon from 'sinon';
import { App, Module, createApp } from '../../src';

describe('App', () => {
	it('should initialize correctly', () => {
		const app = createApp();

		should(app.getModules()).be.Array();
	});

	it('should execute the onInit hook', async () => {
		const onInit = sinon.stub();
		class MyApp extends App {
			onInit(app: App) {
				onInit(app);
			}
		}
		const app = new MyApp();
		await app.init();

		should(onInit.called).be.True();
		should(onInit.getCall(0).args[0]).be.equal(app);
	});

	it('should execute the the onDestroy hook', async () => {
		const onDestroy = sinon.stub();
		class MyApp extends App {
			onDestroy(app: App) {
				onDestroy(app);
			}
		}
		const app = new MyApp();
		await app.init();
		await app.shutdown();

		should(onDestroy.called).be.True();
		should(onDestroy.getCall(0).args[0]).be.equal(app);
	});

	it('should be able to register a module', async () => {
		const app = createApp();
		class MyModule implements Module {
			app: App;
			getModuleId() {
				return 'myModule';
			}

			onRegister(app: App) {
				this.app = app;
			}
		}
		const myModule = new MyModule();
		await app.register(myModule);

		should(myModule.app).be.equal(app);
	});

	it('should be able to register multiple modules #1', async () => {
		const app = createApp();
		class MyModule1 implements Module {
			app: App;
			getModuleId() {
				return 'myModule1';
			}

			onRegister(app: App) {
				this.app = app;
			}
		}

		class MyModule2 extends MyModule1 {
			getModuleId() {
				return 'myModule2';
			}
		}

		const myModule1 = new MyModule1();
		const myModule2 = new MyModule2();
		await app.register(myModule1, myModule2);

		should(myModule1.app).be.equal(app);
		should(myModule2.app).be.equal(app);
	});

	it('should be able to register multiple modules #2', async () => {
		const app = createApp();
		class MyModule1 implements Module {
			app: App;
			getModuleId() {
				return 'myModule1';
			}

			onRegister(app: App) {
				this.app = app;
			}
		}

		class MyModule2 extends MyModule1 {
			getModuleId() {
				return 'myModule2';
			}
		}

		const myModule1 = new MyModule1();
		const myModule2 = new MyModule2();
		await app.register([myModule1, myModule2]);

		should(myModule1.app).be.equal(app);
		should(myModule2.app).be.equal(app);
	});

	it('should error trying to register multiple modules with same identifier', async () => {
		const app = createApp();
		class MyModule1 implements Module {
			app: App;
			getModuleId() {
				return ['myModule'];
			}
		}

		class MyModule2 extends MyModule1 {}

		const myModule1 = new MyModule1();
		const myModule2 = new MyModule2();

		await should(app.register(myModule1, myModule2)).be.rejectedWith({
			message: /A module with the same identifier (.+) has already been registered/,
		});
	});

	it("should execute the modules' onInit hook", async () => {
		const app = createApp();
		class MyModule implements Module {
			app: App;
			getModuleId() {
				return 'myModule';
			}

			onInit(app: App) {
				this.app = app;
			}
		}
		const myModule = new MyModule();
		await app.register(myModule);
		await app.init();

		should(myModule.app).be.equal(app);
	});

	it("should execute the the modules' onDestroy hook", async () => {
		const app = createApp();
		class MyModule implements Module {
			app: App;
			getModuleId() {
				return 'myModule';
			}

			onDestroy(app: App) {
				this.app = app;
			}
		}
		const myModule = new MyModule();
		await app.register(myModule);
		await app.init();
		await app.shutdown();

		should(myModule.app).be.equal(app);
	});
});
