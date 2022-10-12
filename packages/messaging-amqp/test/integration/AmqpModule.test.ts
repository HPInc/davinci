/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { createSandbox } from 'sinon';
import { App, Interceptor, interceptor, nextTick } from '@davinci/core';
import {
	AmqpInterceptorContext,
	AmqpModule,
	ChannelParam,
	Message,
	Payload,
	Subscribe,
	SubscriptionSettings
} from '../../src';
import { expect } from '../support/chai';

const sinon = createSandbox();

const initApp = async (Controller, defaultSubscriptionSettings?: Partial<SubscriptionSettings>) => {
	const handlerSpy = sinon.spy(Controller.prototype, 'handler');
	let app = new App({ logger: { level: 'silent' } }).registerController(Controller);
	const amqpModule = new AmqpModule({
		connection: 'amqp://127.0.0.1/',
		logger: { level: 'silent' },
		defaultSubscriptionSettings
	});
	await app.registerModule(amqpModule);
	// sinon.stub(amqpModule.getConnection(), 'connect');
	await app.init();

	afterEach(async () => {
		await app?.shutdown();
		app = null;
	});

	return { app, amqpModule, handlerSpy };
};

describe('AmqpModule', () => {
	afterEach(() => {
		sinon.restore();
	});

	describe('initialization', () => {
		it('should consume and autoAck messages', async () => {
			class MyController {
				@Subscribe({ name: 'mySubscription', exchange: 'myExchange', topic: 'myTopic', queue: 'myQueue' })
				handler(@Message() message, @Payload() payload, @ChannelParam() channel) {
					return { message, payload, channel };
				}
			}

			const { amqpModule, handlerSpy } = await initApp(MyController, { autoAck: true });

			const subscription = amqpModule.getSubscriptions()[0];

			// publish a message
			const messageContent = {};
			await subscription.channel.publish('myExchange', 'myTopic', messageContent);

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
				@Subscribe({ name: 'mySubscription', exchange: 'myExchange', queue: 'myQueue' })
				handler(@Message() message, @Payload() payload, @ChannelParam() channel) {
					return { message, payload, channel };
				}
			}

			const { amqpModule, handlerSpy } = await initApp(MyController, { autoAck: true });

			const subscription = amqpModule.getSubscriptions()[0];

			// publish a message
			const messageContent = {};
			await subscription.channel.publish('myExchange', '', messageContent);

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
				@Subscribe({ name: 'mySubscription', exchange: 'myExchange', queue: 'myQueue' })
				handler(@Message() message, @Payload() payload, @ChannelParam() channel) {
					return { message, payload, channel };
				}
			}

			const { amqpModule, handlerSpy } = await initApp(MyController, { autoAck: true, json: true });

			const subscription = amqpModule.getSubscriptions()[0];

			// publish a message
			const messageContent = { myContent: true };
			await subscription.channel.publish('myExchange', '', messageContent);

			// assert
			await expect(nextTick(() => handlerSpy.called)).to.eventually.be.true;
			const args = handlerSpy.getCall(0).args;
			expect(args[1]).to.be.deep.equal(messageContent);
		});

		it('should autoNack messages if the handler fails', async () => {
			class MyController {
				@Subscribe({ name: 'mySubscription', exchange: 'myExchange', queue: 'myQueue' })
				handler(@Message() message, @Payload() payload, @ChannelParam() channel) {
					throw new Error('Nasty error');
					return { message, payload, channel };
				}
			}

			const { amqpModule } = await initApp(MyController, { autoNack: true });

			const subscription = amqpModule.getSubscriptions()[0];
			const nackSpy = sinon.spy(subscription.channel, 'nack');

			// publish a message
			const messageContent = { myContent: true };
			await subscription.channel.publish('myExchange', '', messageContent);

			// assert
			await expect(nextTick(() => nackSpy.called)).to.eventually.be.true;
		});

		it('should process the interceptors', async () => {
			const interceptorStub = sinon.stub().callsFake((next => next()) as Interceptor<AmqpInterceptorContext>);
			class MyController {
				@Subscribe({ name: 'mySubscription', exchange: 'myExchange', queue: 'myQueue' })
				@interceptor(interceptorStub)
				handler(@Message() message, @Payload() payload, @ChannelParam() channel) {
					return { message, payload, channel };
				}
			}

			const { amqpModule } = await initApp(MyController, { autoAck: true });

			const subscription = amqpModule.getSubscriptions()[0];

			// publish a message
			const messageContent = { myContent: true };
			await subscription.channel.publish('myExchange', '', messageContent);

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
});
