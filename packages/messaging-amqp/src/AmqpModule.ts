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
	Module
} from '@davinci/core';
import { ClassReflection, ClassType, DecoratorId, MethodReflection, PartialDeep } from '@davinci/reflector';
import { Level, Logger, pino } from 'pino';
import deepmerge from 'deepmerge';
import amqplib, { Channel } from 'amqplib';
import amqpConnectionManager, { AmqpConnectionManager } from 'amqp-connection-manager';
import { ParameterConfiguration, Subscription, SubscriptionSettings } from './types';
import { SubscribeDecoratorMetadata } from './decorators/types';

/* import {AmqpChannel, AmqpConsumer} from '@oneflow/oneflow-message';

const consumer = new AmqpConsumer({})
consumer.subscribe() */

/*
	AMQP lib
	1) amqplib.connect (url | {
			protocol?: string | undefined;
			hostname?: string | undefined;
			port?: number | undefined;
			username?: string | undefined;
			password?: string | undefined;
			locale?: string | undefined;
			frameMax?: number | undefined;
			heartbeat?: number | undefined;
			vhost?: string | undefined;
		}

	2. connection.createChannel()
	3. channel.assertExchange()
	4. channel.assertQueue()
	5. channel.bindQueue(queue, exchange, topic || '#', {});
	6. channel.consume(queue, messageHandler)
*/

/*
	node-amqp-connection-manager
	1) amqpConnectionManager.connect() // same params as amqplib 1)
	2) connection.createChannel({
			name?: string;
			setup?: SetupFunc;
			confirm?: boolean;
			json?: boolean;publishTimeout?: number;
		})
	3) continue with amqplib 3)
 */

/* const connection = amqpConnectionManager.connect({});

const channel = connection.createChannel({});
channel.waitForConnect();
channel.assertExchange();
channel.assertQueue();
channel.bindQueue('', '', '');
channel.consume('', () => {}, {}); */

export interface AmqpModuleOptions {
	connection: string | amqplib.Options.Connect;
	connectionTimeout?: number;
	subscriptions?: Array<SubscriptionSettings>;
	defaultSubscriptionSettings?: PartialDeep<SubscriptionSettings>;
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
	private subscriptions?: Array<Subscription>;

	constructor(options: AmqpModuleOptions) {
		super();
		this.options = deepmerge({ connectionTimeout: 5000, logger: { name: 'AmqpModule', level: 'info' } }, options);
		this.logger = pino({ name: this.options.logger?.name });
		this.logger.level = this.options.logger?.level;
	}

	getModuleId() {
		return ['queue', 'amqp'];
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

				let subscription: Subscription;
				if ('subscriptionName' in decorator) {
					subscription = this.subscriptions.find(s => s.settings?.name === decorator.subscriptionName);
					if (subscription) {
						throw new Error('Invalid subscription name');
					}
				} else {
					subscription = { settings: decorator.options };
					this.subscriptions.push(subscription);
				}

				controllerMethodReflectionsMap.set(subscription, controllerMethodAndReflections);
			});
		});

		this.subscriptions = this.subscriptions.map(s => {
			s.settings = deepmerge<SubscriptionSettings, SubscriptionSettings>(
				{ ...this.options.defaultSubscriptionSettings },
				deepmerge(s.settings, { exchangeType: 'topic', autoAck: true })
			);
			return s;
		});

		await mapSeries(this.subscriptions ?? [], async subscription => {
			const { controller, controllerReflection, methodReflection } =
				controllerMethodReflectionsMap.get(subscription);

			const parametersConfig = this.createParametersConfigurations({
				controllerReflection,
				methodReflection
			});

			subscription.channel = this.connection.createChannel({
				name: subscription.settings.name,
				json: subscription.settings.json,
				setup: async (channel: Channel) => {
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
						channel.consume(
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
					]);
				},
				...subscription.settings.channelOptions
			});

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
				d => d[DecoratorId] === 'messaging-amqp.parameter'
			);

			if (parameterDecoratorMetadata?.[DecoratorId] === 'messaging-amqp.parameter') {
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

				if (subscription.settings?.autoAck) {
					subscription.channel.ack(msg);
				}

				return result;
			} catch (err) {
				const { autoNack } = subscription.settings;
				const { enabled, requeue } =
					typeof autoNack === 'boolean' ? { enabled: autoNack, requeue: false } : autoNack ?? {};
				if (enabled) {
					return subscription.channel.nack(msg, null, requeue);
				}
				throw err;
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
			const decorator = method.decorators.find(d => d[DecoratorId] === 'messaging-amqp.subscribe');
			if (decorator) {
				acc.push({ methodReflection: method, decorator });
			}

			return acc;
		}, []);
	}
}
