/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { createSandbox } from 'sinon';
import { App, di, interceptor, mapSeries, nextTick } from '@davinci/core';
import { channelParam, message, payload, subscribe } from '@davinci/messaging';
import { AmqpInterceptor, AmqpModule, AmqpModuleOptions, ChannelManager, Subscription } from '../../src';
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

describe('AmqpModule', function () {
	this.retries(3);
	let subscriptions: Array<Subscription>;
	let app: App;

	async function initApp(Controller, moduleSettings?: Partial<AmqpModuleOptions>) {
		const handlerSpy = 'handler' in Controller.prototype ? sinon.spy(Controller.prototype, 'handler') : null;
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
		di.container.clearInstances();
	});

	describe('initialization', () => {
		it('should consume and autoAck messages', async () => {
			class MyController {
				@subscribe({
					name: 'mySubscription',
					amqp: {
						exchange: 'testExchange',
						topic: 'testTopic',
						queue: 'testQueue',
						queueOptions: { autoDelete: true }
					}
				})
				handler(@message() msg, @payload() body, @channelParam() channel) {
					return { msg, body, channel };
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
				@subscribe({
					name: 'mySubscription',
					amqp: {
						exchange: 'testExchange',
						queue: 'testQueue',
						queueOptions: { autoDelete: true }
					}
				})
				handler(@message() msg, @payload() body, @channelParam() channel) {
					return { msg, body, channel };
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
				@subscribe({
					name: 'mySubscription',
					amqp: {
						exchange: 'testExchange',
						queue: 'testQueue',
						queueOptions: { autoDelete: true }
					}
				})
				handler(@message() msg, @payload() body, @channelParam() channel) {
					return { msg, body, channel };
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
				@subscribe({
					name: 'mySubscription',
					amqp: {
						exchange: 'testExchange',
						queue: 'testQueue',
						queueOptions: { autoDelete: true }
					}
				})
				handler(@message() msg, @payload() body, @channelParam() channel) {
					throw new Error('Nasty error');
					return { msg, body, channel };
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
			const interceptorStub = sinon.stub().callsFake((next => next()) as AmqpInterceptor);
			class MyController {
				@subscribe({
					name: 'mySubscription',
					amqp: {
						exchange: 'testExchange',
						queue: 'testQueue',
						queueOptions: { autoDelete: true },
						prefetch: 50
					}
				})
				@interceptor(interceptorStub)
				handler(@message() msg, @payload() body, @channelParam() channel) {
					return { msg, body, channel };
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
				channel: subscription.channel,
				subscription,
				state: {}
			});
		});

		it('should reuse a channel, if using the same settings #1', async () => {
			class MyController {
				@subscribe({
					name: 'mySubscription1',
					amqp: {
						exchange: 'testExchange',
						queue: 'testQueue',
						queueOptions: { autoDelete: true }
					}
				})
				handler1() {}

				@subscribe({
					name: 'mySubscription2',
					amqp: {
						exchange: 'testExchange',
						queue: 'testQueue',
						queueOptions: { autoDelete: true }
					}
				})
				handler2() {}
			}

			const { amqpModule } = await initApp(MyController, { defaultSubscriptionSettings: { autoNack: true } });

			expect(Object.keys(amqpModule.getChannels())).to.have.length(1);
		});

		it('should reuse a channel, if using the same settings #2', async () => {
			class MyController {
				@subscribe({
					name: 'mySubscription1',
					amqp: {
						exchange: 'testExchange',
						queue: 'testQueue',
						queueOptions: { autoDelete: true },
						prefetch: 1,
						channelOptions: { confirm: true }
					}
				})
				handler1() {}

				@subscribe({
					name: 'mySubscription2',
					amqp: {
						exchange: 'testExchange',
						queue: 'testQueue',
						queueOptions: { autoDelete: true },
						prefetch: 1,
						channelOptions: { confirm: true }
					}
				})
				handler2() {}
			}

			const { amqpModule } = await initApp(MyController, { defaultSubscriptionSettings: { autoNack: true } });

			expect(Object.keys(amqpModule.getChannels())).to.have.length(1);
		});

		it('should not reuse a channel, if different settings are specified #1', async () => {
			class MyController {
				@subscribe({
					name: 'mySubscription1',
					amqp: {
						exchange: 'testExchange',
						queue: 'testQueue',
						queueOptions: { autoDelete: true },
						prefetch: 10
					}
				})
				handler1() {}

				@subscribe({
					name: 'mySubscription2',
					amqp: {
						exchange: 'testExchange',
						queue: 'testQueue',
						queueOptions: { autoDelete: true },
						prefetch: 1
					}
				})
				handler2() {}
			}

			const { amqpModule } = await initApp(MyController, { defaultSubscriptionSettings: { autoNack: true } });

			expect(Object.keys(amqpModule.getChannels())).to.have.length(2);
		});

		it('should not reuse a channel, if different settings are specified #2', async () => {
			class MyController {
				@subscribe({
					name: 'mySubscription1',
					amqp: {
						exchange: 'testExchange',
						queue: 'testQueue',
						queueOptions: { autoDelete: true },
						channelOptions: {
							name: 'channel1'
						}
					}
				})
				handler1() {}

				@subscribe({
					name: 'mySubscription2',
					amqp: {
						exchange: 'testExchange',
						queue: 'testQueue',
						queueOptions: { autoDelete: true },
						channelOptions: {
							name: 'channel2'
						}
					}
				})
				handler2() {}
			}

			const { amqpModule } = await initApp(MyController, { defaultSubscriptionSettings: { autoNack: true } });

			expect(Object.keys(amqpModule.getChannels())).to.have.length(2);
		});
	});

	describe('ChannelManager', () => {
		it('should inject the channelManager within the controller and publish a message', async () => {
			@di.injectable()
			class MyController {
				constructor(private channelManager?: ChannelManager) {}

				@subscribe({
					name: 'mySubscription1',
					amqp: {
						exchange: 'testExchange1',
						topic: 'testTopic',
						queue: 'testQueue',
						queueOptions: { autoDelete: true }
					}
				})
				async handler1() {
					await this.channelManager.publish('testExchange2', {}, 'testTopic');
					return { success: true };
				}

				@subscribe({
					name: 'mySubscription2',
					amqp: {
						exchange: 'testExchange2',
						topic: 'testTopic',
						queue: 'testQueue',
						queueOptions: { autoDelete: true }
					}
				})
				handler2() {
					return { success: true };
				}
			}

			const handler1Spy = sinon.spy(MyController.prototype, 'handler1');
			const handler2Spy = sinon.spy(MyController.prototype, 'handler2');

			const { amqpModule } = await initApp(MyController, {
				defaultSubscriptionSettings: { autoAck: true }
			});

			const subscription = amqpModule.getSubscriptions()[0];

			// publish a message
			const messageContent = {};
			await subscription.channel.publish('testExchange1', 'testTopic', messageContent);
			await delay(() => {}, 100);

			// assert
			expect(handler1Spy.called).to.be.true;
			expect(handler2Spy.called).to.be.true;
		});

		it('should be able to publish messages', async () => {
			@di.injectable()
			class MyController {
				constructor(private channelManager?: ChannelManager) {}

				@subscribe({
					name: 'mySubscription',
					amqp: {
						exchange: 'testExchange',
						topic: 'testTopic',
						queue: 'testQueue',
						queueOptions: { autoDelete: true }
					}
				})
				handler() {
					return { channelManager: this.channelManager };
				}
			}

			const { amqpModule, handlerSpy } = await initApp(MyController, {
				defaultSubscriptionSettings: { autoAck: true }
			});

			const subscription = amqpModule.getSubscriptions()[0];

			// publish a message
			const messageContent = {};
			await subscription.channel.publish('testExchange', 'testTopic', messageContent);
			await nextTick(() => handlerSpy.called);

			// assert
			const returnValue = handlerSpy.getCall(0).returnValue;

			expect(returnValue.channelManager).to.be.instanceof(ChannelManager);
		});
	});

	describe('shutdown', () => {
		it('should wait until all in-flight messages are processed', async () => {
			class MyController {
				@subscribe({
					name: 'mySubscription',
					amqp: {
						exchange: 'testExchange',
						topic: 'testTopic',
						queue: 'testQueue-wait',
						queueOptions: { autoDelete: true }
					}
				})
				async handler(@message() msg, @payload() body, @channelParam() channel) {
					await delay(() => {}, 1000);
					return { msg, body, channel };
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
			).catch(() => {});

			// assert
			await expect(nextTick(() => handlerSpy.called)).to.eventually.be.true;
			expect(handlerSpy.callCount).to.be.equal(1);
		});

		it('should nack all the in-flight messages', async () => {
			class MyController {
				@subscribe({
					name: 'mySubscription',
					amqp: {
						exchange: 'testExchange',
						topic: 'testTopic',
						queue: 'testQueue-nack',
						queueOptions: { autoDelete: true }
					}
				})
				async handler(@message() msg, @payload() body, @channelParam() channel) {
					await delay(() => {}, 500);
					return { msg, body, channel };
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
