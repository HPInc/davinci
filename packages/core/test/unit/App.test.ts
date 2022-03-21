/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import should from 'should';
import { App, Module, createApp } from '../../src';

describe('App', () => {
	it('should initialize correctly', () => {
		const app = createApp();

		should(app.getModules()).be.Array();
	});

	it('should be able to register a module', async () => {
		const app = createApp();
		class MyModule implements Module {
			app: App;
			getModuleId: () => 'myModule';

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
		class MyModule implements Module {
			app: App;
			getModuleId: () => 'myModule';

			onRegister(app: App) {
				this.app = app;
			}
		}
		const myModule1 = new MyModule();
		const myModule2 = new MyModule();
		await app.register(myModule1, myModule2);

		should(myModule1.app).be.equal(app);
		should(myModule2.app).be.equal(app);
	});

	it('should be able to register multiple modules #2', async () => {
		const app = createApp();
		class MyModule implements Module {
			app: App;
			getModuleId: () => 'myModule';

			onRegister(app: App) {
				this.app = app;
			}
		}
		const myModule1 = new MyModule();
		const myModule2 = new MyModule();
		await app.register([myModule1, myModule2]);

		should(myModule1.app).be.equal(app);
		should(myModule2.app).be.equal(app);
	});

	it('should execute the onInit hook on modules', async () => {
		const app = createApp();
		class MyModule implements Module {
			app: App;
			getModuleId: () => 'myModule';

			onInit(app: App) {
				this.app = app;
			}
		}
		const myModule = new MyModule();
		await app.register(myModule);
		await app.init();

		should(myModule.app).be.equal(app);
	});

	it('should execute the onDestroy hook on modules', async () => {
		const app = createApp();
		class MyModule implements Module {
			app: App;
			getModuleId: () => 'myModule';

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
