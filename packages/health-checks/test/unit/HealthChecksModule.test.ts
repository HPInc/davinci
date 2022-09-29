/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { App } from '@davinci/core';
import { FastifyHttpServer } from '@davinci/http-server-fastify';
import { createSandbox } from 'sinon';
import { healthCheck, HealthChecksModule } from '../../src';
import { expect } from '../support/chai';

const sinon = createSandbox();

describe('HealthChecksModule', () => {
	describe('onInit', () => {
		it('should inspect controllers and initialize correctly', async () => {
			class MyController {
				@healthCheck('readiness')
				onReadinessCheck() {}

				@healthCheck('liveness')
				onLivenessCheck() {}
			}
			const app = new App();
			app.registerController(MyController);
			const fastifyHttpServer = new FastifyHttpServer();
			const healthChecksModule = new HealthChecksModule({
				healthChecks: [
					{ name: 'liveness', endpoint: '/checks/liveness' },
					{ name: 'readiness', endpoint: '/checks/readiness' }
				]
			});
			await app.registerModule(fastifyHttpServer);
			await app.registerModule(healthChecksModule);
			const onInitSpy = sinon.spy(healthChecksModule, 'onInit');

			await app.init();

			expect(onInitSpy.called).to.be.true;
			const onInitResult = await onInitSpy.getCall(0).returnValue;
			expect(onInitResult).to.haveOwnProperty('/checks/liveness').to.be.a('function');
			expect(onInitResult).to.haveOwnProperty('/checks/readiness').to.be.a('function');
		});

		it('should fail if trying to register a health check not listed in the configuration', async () => {
			class MyController {
				@healthCheck('readiness')
				onReadinessCheck() {}
			}
			const app = new App();
			sinon.stub(app, 'getModuleById');
			app.registerController(MyController);
			const healthChecksModule = new HealthChecksModule({
				healthChecks: [{ name: 'liveness', endpoint: '/checks/liveness' }]
			});

			await expect(healthChecksModule.onInit(app)).to.be.rejectedWith(
				'Health check "readiness" not listed in the configuration. Maybe a misspell?'
			);
		});
	});
});
