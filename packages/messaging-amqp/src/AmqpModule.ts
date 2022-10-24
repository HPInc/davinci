/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import {
	App,
	executeInterceptorsStack,
	getInterceptorsHandlers,
	InterceptorBag,
	mapParallel,
	mapSeries,
	Module,
	nextTick
} from '@davinci/core';
import { ClassReflection, ClassType, DecoratorId, MethodReflection, PartialDeep } from '@davinci/reflector';
import { Level, Logger, pino } from 'pino';
import createDeepmerge from '@fastify/deepmerge';
import amqplib, { Channel } from 'amqplib';
import amqpConnectionManager, { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import stringify from 'fast-json-stable-stringify';
import { EventEmitter } from 'events';
import { AmqpSubscriptionSettings, ParameterConfiguration, SubscribeDecoratorMetadata, Subscription } from './types';

const deepmerge = createDeepmerge({ all: true });

export interface AmqpModuleOptions {
	connection: string | amqplib.Options.Connect;
	connectionTimeout?: number;
	subscriptions?: Array<AmqpSubscriptionSettings>;
	defaultSubscriptionSettings?: PartialDeep<AmqpSubscriptionSettings>;
	gracefulShutdownStrategy?: 'none' | 'processInFlight' | 'nackInFlight' | null;
	logger?: {
		name?: string;
		level?: Level | 'silent';
	};
}

export class AmqpModule extends Module {
	app: App;
	private logger: Logger;
	private options: AmqpModuleOptions;
	private connection: AmqpConnectionManager;
	private subscriptions: Array<Subscription>;
	private subscriptionHash: Record<string, Subscription> = {};
	private channelsHash: Record<string, ChannelWrapper> = {};
	private bus: EventEmitter;
	private totalInFlight: number;

	constructor(options: AmqpModuleOptions) {
		super();
		this.options = deepmerge({ connectionTimeout: 5000, logger: { name: 'AmqpModule', level: 'info' } }, options);
		this.bus = new EventEmitter();
		this.logger = pino({ name: this.options.logger?.name });
		this.logger.level = this.options.logger?.level;
		this.totalInFlight = 0;
	}

	getModuleId() {
		return ['messaging', 'amqp'];
	}

	onRegister(app: App) {
		this.app = app;
		const connectionOptions =
			typeof this.options.connection === 'object' ? this.options.connection : { url: this.options.connection };
		this.connection = amqpConnectionManager.connect(connectionOptions);
	}

	async onInit() {
		this.logger.debug('Initializing module');
		await this.connection.connect({ timeout: this.options?.connectionTimeout });
		this.logger.info('Connection established');

		await this.createSubscriptions();
	}

	async onDestroy() {
		if (this.options.gracefulShutdownStrategy === 'processInFlight') {
			this.logger.debug('Waiting for the in-flight messages to be processed');
			// stop consuming new messages
			await mapParallel(this.subscriptions ?? [], subscription => {
				return subscription.channel.removeSetup(subscription.setup, async (channel: amqplib.ConfirmChannel) => {
					return channel.cancel(subscription.consumerTag);
				});
			});
			// wait until they are processed
			await new Promise(resolve => {
				this.bus.once('empty', () => resolve(null));
			});
			this.logger.debug('All the in-flight messages have been processed');
		} else if (this.options.gracefulShutdownStrategy === 'nackInFlight') {
			this.logger.debug('Nacking all the in-flight messages');
			this.bus.emit('nackAll');
			await nextTick();
		}

		await mapParallel(this.subscriptions ?? [], subscription =>
			subscription.channel.close().catch(err => {
				this.logger.info(
					{ subscriptionName: subscription.settings.name, error: err },
					'Channel closed with errors'
				);
			})
		);

		await this.connection.close();
		this.logger.info('Connection closed');
	}

	async createSubscriptions() {
		this.subscriptions = this.options?.subscriptions?.map(options => ({ settings: options })) ?? [];
		const controllerMethodReflectionsMap = new Map<
			Subscription,
			{
				controller: ClassType;
				controllerReflection: ClassReflection;
				methodReflection: MethodReflection;
			}
		>();

		this.app.getControllersWithReflection().forEach(({ Controller, reflection }) => {
			const matches = this.findMatchingMethodAndDecoratorReflections(reflection);

			matches.forEach(({ methodReflection, decorator }) => {
				const controller = new Controller();
				const controllerMethodAndReflections = {
					controller,
					controllerReflection: reflection,
					methodReflection
				};

				const subscription: Subscription = {
					settings: { name: decorator.options.name, ...decorator.options?.amqp }
				};
				this.subscriptions.push(subscription);

				controllerMethodReflectionsMap.set(subscription, controllerMethodAndReflections);
			});
		});

		this.subscriptions = this.subscriptions.map(s => {
			if (this.subscriptionHash[s.settings.name]) {
				throw new Error(`A subscription with the name ${s.settings.name} is already in use`);
			}
			this.subscriptionHash[s.settings.name] = s;

			s.settings = deepmerge<(AmqpSubscriptionSettings | PartialDeep<AmqpSubscriptionSettings>)[]>(
				{ ...this.options.defaultSubscriptionSettings },
				s.settings,
				{ exchangeType: 'topic', autoAck: true }
			) as AmqpSubscriptionSettings;
			return s;
		});

		await mapSeries(this.subscriptions ?? [], async subscription => {
			const { controller, controllerReflection, methodReflection } =
				controllerMethodReflectionsMap.get(subscription);

			const parametersConfig = this.createParametersConfigurations({
				controllerReflection,
				methodReflection
			});

			const setup = async (channel: Channel) => {
				await Promise.all([
					channel.assertExchange(
						subscription.settings.exchange,
						subscription.settings.exchangeType,
						subscription.settings.exchangeOptions
					),
					channel.assertQueue(subscription.settings.queue, subscription.settings.queueOptions),
					subscription.settings.prefetch ? channel.prefetch(subscription.settings.prefetch) : null,

					channel.bindQueue(
						subscription.settings.queue,
						subscription.settings.exchange,
						subscription.settings.topic
					),
					channel
						.consume(
							subscription.settings.queue,
							await this.createMessageHandler({
								controller,
								methodName: methodReflection.name,
								parametersConfig,
								subscription,
								reflections: {
									methodReflection,
									controllerReflection
								}
							}),
							{}
						)
						.then(result => {
							subscription.consumerTag = result.consumerTag;
							return result;
						})
				]);
			};
			const channelKey = stringify({
				...subscription.settings?.channelOptions,
				prefetch: subscription.settings?.prefetch
			});

			// a channel with the same settings exists, reusing it
			if (this.channelsHash[channelKey]) {
				subscription.channel = this.channelsHash[channelKey];
				await subscription.channel.addSetup(setup);
			} else {
				subscription.channel = this.connection.createChannel({
					name: subscription.settings.name,
					json: subscription.settings.json,
					setup,
					...subscription.settings.channelOptions
				});
			}
			// eslint-disable-next-line require-atomic-updates
			subscription.setup = setup;
			this.channelsHash[channelKey] = subscription.channel;

			await subscription.channel.waitForConnect();

			this.logger.debug(
				{ subscription: { name: subscription.settings.name } },
				'Subscription initialized an connected'
			);
		});
	}

	createParametersConfigurations({
		controllerReflection,
		methodReflection
	}: {
		methodReflection: MethodReflection;
		controllerReflection: ClassReflection;
	}): ParameterConfiguration[] {
		return methodReflection.parameters.reduce((acc, parameterReflection) => {
			const parameterDecoratorMetadata = parameterReflection.decorators.find(
				d => d[DecoratorId] === 'messaging.parameter'
			);

			if (parameterDecoratorMetadata?.[DecoratorId] === 'messaging.parameter') {
				const { options } = parameterDecoratorMetadata;
				const parameterType = parameterReflection.type;

				acc.push({
					source: options.in,
					name: parameterReflection.name,
					options,
					type: parameterType
				});
			} else if (parameterDecoratorMetadata?.[DecoratorId] === 'core.parameter.context') {
				acc.push({
					source: 'context',
					options: parameterDecoratorMetadata.options,
					reflection: { controllerReflection, methodReflection }
				});
			} else {
				acc.push(null);
			}

			return acc;
		}, []);
	}

	createMessageHandler({
		controller,
		methodName,
		subscription,
		parametersConfig,
		reflections: { controllerReflection, methodReflection }
	}: {
		controller: InstanceType<ClassType>;
		methodName: string;
		subscription: Subscription;
		parametersConfig: ParameterConfiguration[];
		reflections: { methodReflection: MethodReflection; controllerReflection: ClassReflection };
	}) {
		const interceptors = [
			...getInterceptorsHandlers(controllerReflection),
			...getInterceptorsHandlers(methodReflection)
		];
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const amqpModule = this;

		return async function davinciAmqpMessageHandler(msg: amqplib.ConsumeMessage) {
			amqpModule.logger.debug({ message: msg }, 'Message received');
			amqpModule.setInFlight('increase');
			let ackedOrNacked = false; // semaphore variable

			const onNackAll = () => {
				if (ackedOrNacked) return;

				subscription.channel.nack(msg, null, true);
				amqpModule.setInFlight('decrease');
				ackedOrNacked = true;
			};
			amqpModule.bus.once('nackAll', onNackAll);

			const parametersConfigWithValues = await mapParallel(parametersConfig, parameterCfg => {
				let value;
				if (parameterCfg.source === 'message') {
					value = msg;
				}
				if (parameterCfg.source === 'payload') {
					value = subscription.settings?.json ? JSON.parse(msg.content.toString()) : msg.content;
				}
				if (parameterCfg.source === 'channel') {
					value = subscription.channel;
				}

				return { ...parameterCfg, value };
			});

			const interceptorsBag = amqpModule.prepareInterceptorBag({
				subscription,
				parameters: parametersConfigWithValues.map(p => p.value)
			});

			try {
				const result = await executeInterceptorsStack(
					[...interceptors, (_next, context) => controller[methodName](...context.handlerArgs)],
					interceptorsBag
				);

				if (!ackedOrNacked && subscription.settings?.autoAck) {
					subscription.channel.ack(msg);
					amqpModule.setInFlight('decrease');
					ackedOrNacked = true;
				}

				return result;
			} catch (err) {
				const { autoNack } = subscription.settings;
				const { enabled: nackEnabled, requeue } =
					typeof autoNack === 'boolean' ? { enabled: autoNack, requeue: false } : autoNack ?? {};

				if (!ackedOrNacked && nackEnabled) {
					subscription.channel.nack(msg, null, requeue);
					amqpModule.setInFlight('decrease');
					ackedOrNacked = true;
					return null;
				}

				throw err;
			} finally {
				amqpModule.bus.removeListener('empty', onNackAll);
			}
		};
	}

	getConnection() {
		return this.connection;
	}

	getOptions() {
		return this.options;
	}

	getSubscriptions() {
		return this.subscriptions;
	}

	getChannelsHash() {
		return this.channelsHash;
	}

	private setInFlight(action: 'increase' | 'decrease') {
		if (action === 'increase') {
			this.totalInFlight += 1;
			this.bus.emit('addedInFlightMessage', { totalInFlight: this.totalInFlight });
		} else {
			this.totalInFlight -= 1;
			this.bus.emit('removedInFlightMessage', { totalInFlight: this.totalInFlight });
		}

		if (this.totalInFlight === 0) {
			this.bus.emit('empty');
		}
	}

	private prepareInterceptorBag({
		subscription,
		parameters
	}: {
		subscription: Subscription;
		parameters: any[];
	}): InterceptorBag {
		return {
			module: 'messaging-amqp',
			handlerArgs: parameters,
			context: { channel: subscription.channel, subscription },
			state: {}
		};
	}

	private findMatchingMethodAndDecoratorReflections(controllerReflection: ClassReflection) {
		return controllerReflection.methods.reduce<
			{ methodReflection: MethodReflection; decorator: SubscribeDecoratorMetadata }[]
		>((acc, method) => {
			const decorator = method.decorators.find(d => d[DecoratorId] === 'messaging.subscribe');
			if (decorator) {
				acc.push({ methodReflection: method, decorator });
			}

			return acc;
		}, []);
	}
}
