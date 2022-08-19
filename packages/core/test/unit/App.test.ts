/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { createSandbox } from 'sinon';
import { decorate, decorateParameter, reflect } from '@davinci/reflector';
import { App, createApp, Module } from '../../src';
import { expect } from '../support/chai';

const sinon = createSandbox();

describe('App', () => {
	afterEach(() => {
		sinon.restore();
	});

	it('should instantiate correctly', () => {
		class MyController {}
		const app = new App({ controllers: [MyController] });

		expect(app.getModules()).to.be.an('array');
		expect(app.getControllers()).to.be.deep.equal([MyController]);
		expect(app.getModuleId()).to.be.equal('app');
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
		const app = createApp();
		await app.registerModule([new MyModule()]);

		await expect(app.init()).to.be.rejectedWith('Error within MyModule');
	});

	it('should throw and exception and exit if an error happens during a module registration', async () => {
		class MyModule implements Module {
			getModuleId() {
				return 'myModule';
			}

			onRegister() {
				throw new Error('Error within MyModule');
			}
		}
		const app = createApp();

		await expect(app.registerModule([new MyModule()])).to.be.rejectedWith('Error within MyModule');
	});

	it('should ignore exceptions on modules happening on destroy', async () => {
		class MyModule implements Module {
			getModuleId() {
				return 'myModule';
			}

			onDestroy() {
				throw new Error('Error within MyModule');
			}
		}
		const app = createApp();
		await app.registerModule([new MyModule()]);
		const moduleLoggerErrorSpy = sinon.spy(app.logger, 'error');
		const appLoggerFatalSpy = sinon.spy(app.logger, 'fatal');
		await app.init();

		await expect(app.shutdown()).to.not.be.rejected;
		expect(moduleLoggerErrorSpy.getCall(0).lastArg).to.be.equal('Error while destroying module');
		expect(appLoggerFatalSpy.called).to.be.false;
	});

	it('should throw and exception and exit if an error happens in onDestroy', async () => {
		class MyApp extends App {
			onDestroy() {
				throw new Error('bad error');
			}
		}
		const app = new MyApp();
		const appLoggerFatalSpy = sinon.spy(app.logger, 'fatal');
		await app.init();

		await expect(app.shutdown()).to.be.rejectedWith('bad error');
		expect(appLoggerFatalSpy.getCall(0).lastArg).to.be.equal('Fatal error');
	});

	it('should register controllers', () => {
		class MyController {}
		const app = createApp();
		app.registerController(MyController);
		app.registerController([MyController, MyController]);
		app.registerController(MyController, MyController);

		expect(app.getModules()).to.be.an('array');
		expect(app.getControllers()).to.be.deep.equal([
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

		expect(controllersReflection).to.be.deep.equal([
			{ Controller: MyController, reflection: myControllerReflection }
		]);
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

		expect(getControllerReflectionSpy.callCount).to.be.equal(1);
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

		expect(onInit.called).to.be.true;
		expect(onInit.getCall(0).args[0]).to.be.equal(app);
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

		expect(onDestroy.called).to.be.true;
		expect(onDestroy.getCall(0).args[0]).to.be.equal(app);
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
		await app.registerModule(myModule);

		expect(app.getModules()[0]).to.be.equal(myModule);
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
		await app.registerModule([myModule1, myModule2]);

		expect(app.getModules()).to.be.deep.equal([myModule1, myModule2]);
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
			await app.registerModule([myModule1, myModule2]);
			throw new Error('failed test');
		} catch (err) {
			expect(err.message).to.match(/A module with the same identifier (.+) has already been registered/);
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
		await app.registerModule(myModule);
		await app.init();

		expect(myModule.app).to.be.equal(app);
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
		await app.registerModule(myModule);
		await app.init();
		await app.shutdown();

		expect(myModule.app).to.be.equal(app);
	});

	it("should execute the modules' onRegister hook", async () => {
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
		await app.registerModule(myModule);
		await app.init();

		expect(myModule.app).to.be.equal(app);
	});

	it('should track lifecycle changes via the status property #1', async () => {
		const app = new App();
		expect(app.getStatus()).to.be.equal('unloaded');

		const initPromise = app.init();
		expect(app.getStatus()).to.be.equal('initializing');
		await initPromise;
		expect(app.getStatus()).to.be.equal('initialized');

		const shutdownPromise = app.shutdown();
		expect(app.getStatus()).to.be.equal('destroying');
		await shutdownPromise;
		expect(app.getStatus()).to.be.equal('destroyed');
	});

	it('should track lifecycle changes via the status property #2', async () => {
		class MyModule implements Module {
			app: App;
			getModuleId() {
				return 'myModule';
			}

			onInit() {
				throw new Error('error');
			}
		}

		const app = new App();
		await app.registerModule(new MyModule());

		await expect(app.init()).to.be.rejected;
		expect(app.getStatus()).to.be.equal('error');
	});

	it('should get a module by its id', async () => {
		class MyModule implements Module {
			app: App;
			getModuleId() {
				return 'myModule';
			}
		}

		const app = new App();
		await app.registerModule(new MyModule());
		const module = await app.getModuleById('myModule');

		expect(module).to.be.instanceof(MyModule);
	});

	it('should get an initialized module by its id', async () => {
		class MyModule implements Module {
			app: App;
			initialized: boolean;
			onInit() {
				this.initialized = true;
			}

			getModuleId() {
				return 'myModule';
			}
		}

		const app = new App();
		await app.registerModule(new MyModule());
		app.init();
		const module = await app.getModuleById<MyModule>('myModule', true);

		expect(module.initialized).to.be.true;
	});

	it('should ignore duplicated shutdown signals', async () => {
		const app = new App({ shutdown: { enabled: true, signals: ['SIGTERM'] } });
		const shutdownSpy = sinon.spy(app, 'shutdown');
		sinon.stub(process, 'exit');
		await app.init();

		// @ts-ignore
		process.emit('SIGTERM');
		// @ts-ignore
		process.emit('SIGTERM');

		expect(shutdownSpy.callCount).to.be.equal(1);
	});

	it('should exit 1 in case of errors during shutdown', async () => {
		const app = new App({ shutdown: { enabled: true, signals: ['SIGTERM'] } });
		sinon.stub(app, 'shutdown').throws('bad error');
		const processExitStub = sinon.stub(process, 'exit');
		await app.init();

		// @ts-ignore
		process.emit('SIGTERM');

		expect(processExitStub.firstCall.lastArg).to.be.equal(1);
	});

	it('should return the options', () => {
		class MyController {}
		const options = { controllers: [MyController], shutdown: { enabled: true } };
		const app = new App(options);

		expect(app.getOptions()).to.containSubset(options);
	});
});
