/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import should from 'should';
import sinon from 'sinon';
import { decorate, decorateParameter, reflect } from '@davinci/reflector';
import { App, createApp, Module } from '../../src';

describe('App', () => {
	it('should initialize correctly', () => {
		class MyController {}
		const app = createApp({ controllers: [MyController] });

		should(app.getModules()).be.Array();
		should(app.getControllers()).be.deepEqual([MyController]);
	});

	it('should throw and exception and exit if an error happens during init', async () => {
		class MyModule implements Module {
			getModuleId() {
				return 'myModule';
			}

			onInit() {
				throw new Error('Error within MyModule');
			}
		}
		const app = createApp().registerModule([new MyModule()]);

		await should(app.init()).be.rejectedWith('Error within MyModule');
	});

	it('should register controllers', () => {
		class MyController {}
		const app = createApp();
		app.registerController(MyController);
		app.registerController([MyController, MyController]);
		app.registerController(MyController, MyController);

		should(app.getModules()).be.Array();
		should(app.getControllers()).be.deepEqual([
			MyController,
			MyController,
			MyController,
			MyController,
			MyController
		]);
	});

	it('should return the controllers reflection', () => {
		@decorate({ isMyClass: true })
		class MyController {
			@decorate({ isMyMethod: true })
			myMethod(@decorateParameter({ isMyParam: true }) param: string) {
				return param;
			}
		}
		const myControllerReflection = reflect(MyController);
		const app = createApp({ controllers: [MyController] });

		const controllersReflection = app.getControllersWithReflection();

		should(controllersReflection).be.deepEqual([{ Controller: MyController, reflection: myControllerReflection }]);
	});

	it('should cache the reflection result', () => {
		@decorate({ isMyClass: true })
		class MyController {
			@decorate({ isMyMethod: true })
			myMethod(@decorateParameter({ isMyParam: true }) param: string) {
				return param;
			}
		}
		const app = createApp({ controllers: [MyController] });

		const getControllerReflectionSpy = sinon.spy(app, 'getControllerReflection');
		app.getControllersWithReflection();
		app.getControllersWithReflection();

		should(getControllerReflectionSpy.callCount).be.equal(1);
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
		}
		const myModule = new MyModule();
		app.registerModule(myModule);

		should(app.getModules()[0]).be.equal(myModule);
	});

	it('should be able to register multiple modules #1', async () => {
		const app = createApp();
		class MyModule1 implements Module {
			app: App;
			getModuleId() {
				return 'myModule1';
			}
		}

		class MyModule2 extends MyModule1 {
			getModuleId() {
				return 'myModule2';
			}
		}

		const myModule1 = new MyModule1();
		const myModule2 = new MyModule2();
		app.registerModule([myModule1, myModule2]);

		should(app.getModules()).be.deepEqual([myModule1, myModule2]);
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

		try {
			app.registerModule([myModule1, myModule2]);
			throw new Error('failed test');
		} catch (err) {
			should(err).match({
				message: /A module with the same identifier (.+) has already been registered/
			});
		}
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
		app.registerModule(myModule);
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
		app.registerModule(myModule);
		await app.init();
		await app.shutdown();

		should(myModule.app).be.equal(app);
	});
});
