/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { createSandbox } from 'sinon';
import { App, Interceptor, interceptor, mapSeries, nextTick } from '@davinci/core';
import {
	AmqpInterceptorContext,
	AmqpModule,
	AmqpModuleOptions,
	ChannelParam,
	Message,
	Payload,
	Subscribe,
	Subscription
} from '../../src';
import { expect } from '../support/chai';

const sinon = createSandbox();

const delay = (fn: Function, ms: number) =>
	new Promise((resolve, reject) =>
		setTimeout(async () => {
			try {
				await fn();
				resolve(null);
			} catch (err) {
				reject(err);
			}
		}, ms)
	);

describe('AmqpModule', () => {
	let subscriptions: Array<Subscription>;
	let app: App;

	async function initApp(Controller, moduleSettings?: Partial<AmqpModuleOptions>) {
		const handlerSpy = sinon.spy(Controller.prototype, 'handler');
		app = new App({ logger: { level: 'silent' } }).registerController(Controller);
		const amqpModule = new AmqpModule({
			connection: 'amqp://127.0.0.1/',
			logger: { level: 'silent' },
			...moduleSettings
		});
		await app.registerModule(amqpModule);
		// sinon.stub(amqpModule.getConnection(), 'connect');
		await app.init();
		subscriptions = amqpModule.getSubscriptions();

		return { app, amqpModule, handlerSpy };
	}

	const purgeQueues = () =>
		mapSeries(subscriptions ?? [], subscription =>
			subscription.channel.purgeQueue(subscription.settings.queue).catch(() => {})
		);

	beforeEach(async () => {
		await purgeQueues();
	});

	afterEach(async () => {
		await purgeQueues();
		await app?.shutdown();
		app = null;
		sinon.restore();
	});

	describe('initialization', () => {
		it('should consume and autoAck messages', async () => {
			class MyController {
				@Subscribe({ name: 'mySubscription', exchange: 'testExchange', topic: 'testTopic', queue: 'testQueue' })
				handler(@Message() message, @Payload() payload, @ChannelParam() channel) {
					return { message, payload, channel };
				}
			}

			const { amqpModule, handlerSpy } = await initApp(MyController, {
				defaultSubscriptionSettings: { autoAck: true }
			});

			const subscription = amqpModule.getSubscriptions()[0];

			// publish a message
			const messageContent = {};
			await subscription.channel.publish('testExchange', 'testTopic', messageContent);

			// assert
			await expect(nextTick(() => handlerSpy.called)).to.eventually.be.true;
			const args = handlerSpy.getCall(0).args;
			expect(args[0]).to.have.property('fields');
			expect(args[0]).to.have.property('properties');
			expect(args[0]).to.have.property('content');

			expect(args[1]).to.be.instanceof(Buffer);
			expect(args[2].constructor.name).to.be.equal('ChannelWrapper');
		});

		it('should consume and autoAck messages with no topic specified', async () => {
			class MyController {
				@Subscribe({ name: 'mySubscription', exchange: 'testExchange', queue: 'testQueue' })
				handler(@Message() message, @Payload() payload, @ChannelParam() channel) {
					return { message, payload, channel };
				}
			}

			const { amqpModule, handlerSpy } = await initApp(MyController, {
				defaultSubscriptionSettings: { autoAck: true }
			});

			const subscription = amqpModule.getSubscriptions()[0];

			// publish a message
			const messageContent = {};
			await subscription.channel.publish('testExchange', '', messageContent);

			await expect(nextTick(() => handlerSpy.called)).to.eventually.be.true;
			const args = handlerSpy.getCall(0).args;
			expect(args[0]).to.have.property('fields');
			expect(args[0]).to.have.property('properties');
			expect(args[0]).to.have.property('content');

			expect(args[1]).to.be.instanceof(Buffer);
			expect(args[2].constructor.name).to.be.equal('ChannelWrapper');
		});

		it('should consume json messages', async () => {
			class MyController {
				@Subscribe({ name: 'mySubscription', exchange: 'testExchange', queue: 'testQueue' })
				handler(@Message() message, @Payload() payload, @ChannelParam() channel) {
					return { message, payload, channel };
				}
			}

			const { amqpModule, handlerSpy } = await initApp(MyController, {
				defaultSubscriptionSettings: { autoAck: true, json: true }
			});

			const subscription = amqpModule.getSubscriptions()[0];

			// publish a message
			const messageContent = { myContent: true };
			await subscription.channel.publish('testExchange', '', messageContent);

			// assert
			await expect(nextTick(() => handlerSpy.called)).to.eventually.be.true;
			const args = handlerSpy.getCall(0).args;
			expect(args[1]).to.be.deep.equal(messageContent);
		});

		it('should autoNack messages if the handler fails', async () => {
			class MyController {
				@Subscribe({ name: 'mySubscription', exchange: 'testExchange', queue: 'testQueue' })
				handler(@Message() message, @Payload() payload, @ChannelParam() channel) {
					throw new Error('Nasty error');
					return { message, payload, channel };
				}
			}

			const { amqpModule } = await initApp(MyController, { defaultSubscriptionSettings: { autoNack: true } });

			const subscription = amqpModule.getSubscriptions()[0];
			const nackSpy = sinon.spy(subscription.channel, 'nack');

			// publish a message
			const messageContent = { myContent: true };
			await subscription.channel.publish('testExchange', '', messageContent);

			// assert
			await expect(nextTick(() => nackSpy.called)).to.eventually.be.true;
		});

		it('should process the interceptors', async () => {
			const interceptorStub = sinon.stub().callsFake((next => next()) as Interceptor<AmqpInterceptorContext>);
			class MyController {
				@Subscribe({ name: 'mySubscription', exchange: 'testExchange', queue: 'testQueue', prefetch: 50 })
				@interceptor(interceptorStub)
				handler(@Message() message, @Payload() payload, @ChannelParam() channel) {
					return { message, payload, channel };
				}
			}

			const { amqpModule } = await initApp(MyController, { defaultSubscriptionSettings: { autoAck: true } });

			const subscription = amqpModule.getSubscriptions()[0];

			// publish a message
			const messageContent = { myContent: true };
			await subscription.channel.publish('testExchange', '', messageContent);

			// assert
			await expect(nextTick(() => interceptorStub.called)).to.eventually.be.true;
			const [, bag] = interceptorStub.getCall(0).args;

			expect(bag).to.containSubset({
				module: 'messaging-amqp',
				context: { channel: subscription.channel, subscription },
				state: {}
			});
		});
	});

	describe('shutdown', () => {
		it('should wait until all in-flight messages are processed', async () => {
			class MyController {
				@Subscribe({
					name: 'mySubscription',
					exchange: 'testExchange',
					topic: 'testTopic',
					queue: 'testQueue1'
				})
				async handler(@Message() message, @Payload() payload, @ChannelParam() channel) {
					await new Promise(resolve => setTimeout(() => resolve(null), 1000));
					return { message, payload, channel };
				}
			}

			const { app, amqpModule, handlerSpy } = await initApp(MyController, {
				defaultSubscriptionSettings: { autoAck: true },
				gracefulShutdownStrategy: 'processInFlight'
			});

			const subscription = amqpModule.getSubscriptions()[0];

			// publish a message
			await subscription.channel.publish('testExchange', 'testTopic', {});
			app.shutdown();
			// these message shouldn't be consumed
			await delay(
				() =>
					Promise.all([
						subscription.channel.publish('testExchange', 'testTopic', {}),
						subscription.channel.publish('testExchange', 'testTopic', {})
					]),
				500
			);

			// assert
			await expect(nextTick(() => handlerSpy.called)).to.eventually.be.true;
			expect(handlerSpy.callCount).to.be.equal(1);
		});

		it('should nack all the in-flight messages', async () => {
			class MyController {
				@Subscribe({
					name: 'mySubscription',
					exchange: 'testExchange',
					topic: 'testTopic',
					queue: 'testQueue2'
				})
				async handler(@Message() message, @Payload() payload, @ChannelParam() channel) {
					await new Promise(resolve => setTimeout(() => resolve(null), 1000));
					return { message, payload, channel };
				}
			}

			const { app, amqpModule, handlerSpy } = await initApp(MyController, {
				defaultSubscriptionSettings: { autoAck: true },
				gracefulShutdownStrategy: 'nackInFlight'
			});

			const subscription = amqpModule.getSubscriptions()[0];
			const nackSpy = sinon.spy(subscription.channel, 'nack');

			// publish a message
			await subscription.channel.publish('testExchange', 'testTopic', {});
			await subscription.channel.publish('testExchange', 'testTopic', {});
			await app.shutdown();

			// assert
			await expect(nextTick(() => handlerSpy.called)).to.eventually.be.true;
			expect(handlerSpy.callCount).to.be.equal(2);
			expect(nackSpy.callCount).to.be.equal(2);
		});
	});
});
